<?php

namespace App\Libraries;

class TextTemplate
{
    /** Replace {key} placeholders in a message. */
    public static function apply(string $template, array $vars): string
    {
        $out = $template;
        foreach ($vars as $key => $value) {
            $out = str_replace('{' . $key . '}', (string) $value, $out);
        }
        return $out;
    }
}
