<?php


namespace SmashBalloon\WPChat\Vendor\DI\Definition\Helper;

use SmashBalloon\WPChat\Vendor\DI\Definition\Definition;
/**
 * Helps defining container entries.
 *
 * @author Matthieu Napoli <matthieu@mnapoli.fr>
 */
interface DefinitionHelper
{
    /**
     * @param string $entryName Container entry name
     */
    public function getDefinition(string $entryName): Definition;
}
