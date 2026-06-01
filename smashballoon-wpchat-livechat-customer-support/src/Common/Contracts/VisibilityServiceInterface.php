<?php

namespace SmashBalloon\WPChat\Common\Contracts;

/**
 * Interface VisibilityServiceInterface
 * 
 * Contract for visibility services that determine chatbot display rules.
 */
interface VisibilityServiceInterface
{
    /**
     * Determines whether the chatbot should be included.
     *
     * @return array ['should_include' => bool, 'funnel_id' => int|null]
     */
    public function shouldIncludeChatbot(): array;
}