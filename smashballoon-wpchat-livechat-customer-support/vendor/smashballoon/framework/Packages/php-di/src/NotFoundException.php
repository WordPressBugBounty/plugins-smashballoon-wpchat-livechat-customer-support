<?php


namespace SmashBalloon\WPChat\Vendor\DI;

use SmashBalloon\WPChat\Vendor\Psr\Container\NotFoundExceptionInterface;
/**
 * Exception thrown when a class or a value is not found in the container.
 */
class NotFoundException extends \Exception implements NotFoundExceptionInterface
{
}
