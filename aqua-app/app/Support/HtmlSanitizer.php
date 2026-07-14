<?php

namespace App\Support;

use HTMLPurifier;
use HTMLPurifier_Config;

/**
 * Shared rich-text sanitizer for every admin-editable HTML field in the
 * app (Site Settings' `about` fields, Services' descriptions, and any
 * future module using the same RichTextArea.tsx editor). One allow-list,
 * one place to change it.
 */
class HtmlSanitizer
{
    public function purify(string $html): string
    {
        return $this->purifier()->purify($html);
    }

    /**
     * Allow-list matches exactly what RichTextArea.tsx's toolbar can
     * produce (formatBlock P/H1/H2/H3, bold/italic/underline, justify*,
     * lists) plus the inline styles execCommand actually sets
     * (text-align, letter-spacing) — confirmed against real exported
     * content, not guessed. Everything else (script, event handlers,
     * iframe, etc.) is stripped.
     */
    private function purifier(): HTMLPurifier
    {
        $config = HTMLPurifier_Config::createDefault();
        $config->set('HTML.Allowed', 'p,h1,h2,h3,b,i,u,strong,em,ul,ol,li,br,div[style],span[style]');
        $config->set('CSS.AllowedProperties', 'text-align,font-size,letter-spacing,font-weight,text-decoration');
        $config->set('Cache.DefinitionImpl', null);

        return new HTMLPurifier($config);
    }
}
