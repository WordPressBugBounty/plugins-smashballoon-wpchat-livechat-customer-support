<?php

namespace SmashBalloon\WPChat\Common\Services\JWT;

/**
 * Class JWTVerifier
 * 
 * Lightweight JWT verification without external dependencies.
 * Supports ES256 (ECDSA) and Ed25519 algorithms.
 * 
 * @package SmashBalloon\WPChat\Common\Services\JWT
 */
class JWTVerifier
{
    /**
     * Time leeway in seconds for exp/iat validation.
     */
    private const LEEWAY = 60;

    /**
     * Supported algorithms.
     */
    private const SUPPORTED_ALGS = ['ES256', 'Ed25519', 'RS256'];

    /**
     * Verify a JWT token.
     *
     * @param string $token The JWT token.
     * @param string $key The public key.
     * @param string $alg The expected algorithm.
     * @return array Verification result.
     */
    public function verify(string $token, string $key, string $alg): array
    {
        try {
            // Split token
            $parts = explode('.', $token);
            if (count($parts) !== 3) {
                return [
                    'valid' => false,
                    'error' => 'invalid_format',
                    'message' => 'Invalid token format',
                ];
            }

            list($headerB64, $payloadB64, $signatureB64) = $parts;

            // Decode header
            $header = json_decode($this->base64UrlDecode($headerB64), true);
            if (!$header) {
                return [
                    'valid' => false,
                    'error' => 'invalid_header',
                    'message' => 'Invalid token header',
                ];
            }

            // Verify algorithm
            if (!isset($header['alg']) || $header['alg'] !== $alg) {
                return [
                    'valid' => false,
                    'error' => 'algorithm_mismatch',
                    'message' => 'Algorithm mismatch',
                ];
            }

            if (!in_array($alg, self::SUPPORTED_ALGS)) {
                return [
                    'valid' => false,
                    'error' => 'unsupported_algorithm',
                    'message' => 'Unsupported algorithm: ' . $alg,
                ];
            }

            // Decode payload
            $payload = json_decode($this->base64UrlDecode($payloadB64), true);
            if (!$payload) {
                return [
                    'valid' => false,
                    'error' => 'invalid_payload',
                    'message' => 'Invalid token payload',
                ];
            }

            // Verify signature
            $signature = $this->base64UrlDecode($signatureB64);
            $signingInput = $headerB64 . '.' . $payloadB64;

            if (!$this->verifySignature($signingInput, $signature, $key, $alg)) {
                return [
                    'valid' => false,
                    'error' => 'invalid_signature',
                    'message' => 'Invalid signature',
                ];
            }

            // Verify time claims
            $now = time();

            // Check expiration
            if (isset($payload['exp']) && $payload['exp'] < ($now - self::LEEWAY)) {
                return [
                    'valid' => false,
                    'error' => 'expired',
                    'message' => 'Token has expired',
                ];
            }

            // Check not before
            if (isset($payload['nbf']) && $payload['nbf'] > ($now + self::LEEWAY)) {
                return [
                    'valid' => false,
                    'error' => 'not_yet_valid',
                    'message' => 'Token is not yet valid',
                ];
            }

            // Check issued at
            if (isset($payload['iat']) && $payload['iat'] > ($now + self::LEEWAY)) {
                return [
                    'valid' => false,
                    'error' => 'invalid_issued_at',
                    'message' => 'Token issued in the future',
                ];
            }

            return [
                'valid' => true,
                'payload' => $payload,
                'header' => $header,
            ];
        } catch (\Exception $e) {
            return [
                'valid' => false,
                'error' => 'verification_error',
                'message' => 'Verification error: ' . $e->getMessage(),
            ];
        }
    }

    /**
     * Verify signature based on algorithm.
     *
     * @param string $signingInput The data that was signed.
     * @param string $signature The signature to verify.
     * @param string $key The public key.
     * @param string $alg The algorithm.
     * @return bool
     */
    private function verifySignature(string $signingInput, string $signature, string $key, string $alg): bool
    {
        switch ($alg) {
            case 'ES256':
                return $this->verifyES256($signingInput, $signature, $key);
            case 'Ed25519':
                return $this->verifyEd25519($signingInput, $signature, $key);
            case 'RS256':
                return $this->verifyRS256($signingInput, $signature, $key);
            default:
                return false;
        }
    }

    /**
     * Verify ES256 (ECDSA with P-256 and SHA-256).
     *
     * @param string $signingInput
     * @param string $signature
     * @param string $key
     * @return bool
     */
    private function verifyES256(string $signingInput, string $signature, string $key): bool
    {
        if (!function_exists('openssl_verify')) {
            return false;
        }

        // Convert key to PEM format if needed
        if (strpos($key, '-----BEGIN') === false) {
            $key = "-----BEGIN PUBLIC KEY-----\n" . 
                   chunk_split(base64_encode($key), 64, "\n") . 
                   "-----END PUBLIC KEY-----\n";
        }

        // ES256 signatures need to be in DER format for OpenSSL
        $signature = $this->convertES256SignatureToDER($signature);
        
        // OpenSSL expects the raw message, not the hash, for ECDSA
        return openssl_verify($signingInput, $signature, $key, OPENSSL_ALGO_SHA256) === 1;
    }

    /**
     * Verify Ed25519.
     *
     * @param string $signingInput
     * @param string $signature
     * @param string $key
     * @return bool
     */
    private function verifyEd25519(string $signingInput, string $signature, string $key): bool
    {
        if (!function_exists('sodium_crypto_sign_verify_detached')) {
            return false;
        }

        // Ed25519 public keys are 32 bytes
        if (strlen($key) !== 32) {
            return false;
        }

        return sodium_crypto_sign_verify_detached($signature, $signingInput, $key);
    }

    /**
     * Verify RS256 (RSA with SHA-256).
     *
     * @param string $signingInput
     * @param string $signature
     * @param string $key
     * @return bool
     */
    private function verifyRS256(string $signingInput, string $signature, string $key): bool
    {
        if (!function_exists('openssl_verify')) {
            return false;
        }

        // Convert key to PEM format if needed
        if (strpos($key, '-----BEGIN') === false) {
            $key = "-----BEGIN PUBLIC KEY-----\n" . 
                   chunk_split(base64_encode($key), 64, "\n") . 
                   "-----END PUBLIC KEY-----\n";
        }

        return openssl_verify($signingInput, $signature, $key, OPENSSL_ALGO_SHA256) === 1;
    }

    /**
     * Convert ES256 signature from concatenated format to DER.
     *
     * @param string $signature
     * @return string
     */
    private function convertES256SignatureToDER(string $signature): string
    {
        // ES256 signatures are 64 bytes (32 bytes for r, 32 bytes for s)
        if (strlen($signature) !== 64) {
            return $signature;
        }

        $r = substr($signature, 0, 32);
        $s = substr($signature, 32, 32);

        // Convert to DER format
        $r = ltrim($r, "\x00");
        $s = ltrim($s, "\x00");

        // Add padding if high bit is set
        if (ord($r[0]) & 0x80) {
            $r = "\x00" . $r;
        }
        if (ord($s[0]) & 0x80) {
            $s = "\x00" . $s;
        }

        $rLen = strlen($r);
        $sLen = strlen($s);

        $totalLen = $rLen + $sLen + 4;
        $der = "\x30" . chr($totalLen) . "\x02" . chr($rLen) . $r . "\x02" . chr($sLen) . $s;

        return $der;
    }

    /**
     * Base64 URL decode.
     *
     * @param string $input
     * @return string
     */
    private function base64UrlDecode(string $input): string
    {
        $remainder = strlen($input) % 4;
        if ($remainder) {
            $padlen = 4 - $remainder;
            $input .= str_repeat('=', $padlen);
        }
        return base64_decode(strtr($input, '-_', '+/'));
    }
}