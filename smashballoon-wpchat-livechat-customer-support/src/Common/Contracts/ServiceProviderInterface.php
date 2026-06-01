<?php

namespace SmashBalloon\WPChat\Common\Contracts;

/**
 * ServiceProviderInterface
 *
 * This interface defines the contract for service providers.
 */
interface ServiceProviderInterface
{
	/**
	 * Register the service provider.
	 *
	 * This method is used to register the service provider with the service container.
	 *
	 * @return void
	 */
	public function register(): void;
}
