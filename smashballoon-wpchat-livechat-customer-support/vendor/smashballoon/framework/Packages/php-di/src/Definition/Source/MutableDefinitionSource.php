<?php


namespace SmashBalloon\WPChat\Vendor\DI\Definition\Source;

use SmashBalloon\WPChat\Vendor\DI\Definition\Definition;
/**
 * Describes a definition source to which we can add new definitions.
 *
 * @author Matthieu Napoli <matthieu@mnapoli.fr>
 */
interface MutableDefinitionSource extends DefinitionSource
{
    public function addDefinition(Definition $definition);
}
