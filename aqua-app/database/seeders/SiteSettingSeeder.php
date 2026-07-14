<?php

namespace Database\Seeders;

use App\Models\SiteSetting;
use Illuminate\Database\Seeder;

/**
 * Seeds the real values exported (read-only) from the live Supabase
 * site_settings table for hero/about/contact — see
 * database/seeders/fixtures/site_settings_from_supabase.json.
 *
 * No "values" row existed in Supabase at export time, so the "values" key
 * is seeded with the same defaults the old frontend already fell back to
 * (aqua-frontend's dashboard.settings.tsx DEFAULTS.values), preserving
 * identical current public-facing behavior.
 *
 * Intentionally NOT run automatically on every deploy — run once manually
 * after the first migration, so a later redeploy can never clobber live
 * admin edits.
 */
class SiteSettingSeeder extends Seeder
{
    public function run(): void
    {
        $exported = json_decode(
            file_get_contents(__DIR__.'/fixtures/site_settings_from_supabase.json'),
            true,
        );

        foreach ($exported as $row) {
            SiteSetting::updateOrCreate(['key' => $row['key']], ['value' => $row['value']]);
        }

        SiteSetting::updateOrCreate(['key' => 'values'], ['value' => [
            'eyebrow_ar' => 'ما نؤمن به',
            'eyebrow_en' => 'What we stand for',
            'title_ar' => 'قيمنا',
            'title_en' => 'Our Values',
            'items' => [
                [
                    'icon' => 'Award',
                    'title_ar' => 'الجودة أولاً',
                    'title_en' => 'Quality First',
                    'desc_ar' => 'نستخدم أفضل المواد العالمية ونلتزم بأعلى معايير التنفيذ.',
                    'desc_en' => 'We use top global materials and uphold the highest execution standards.',
                ],
                [
                    'icon' => 'Lightbulb',
                    'title_ar' => 'الابتكار',
                    'title_en' => 'Innovation',
                    'desc_ar' => 'نواكب أحدث التقنيات في عالم المسابح لنقدمها لعملائنا.',
                    'desc_en' => 'We bring the latest pool technologies to our clients.',
                ],
                [
                    'icon' => 'HeartHandshake',
                    'title_ar' => 'رضا العميل',
                    'title_en' => 'Client Satisfaction',
                    'desc_ar' => 'نجاحنا الحقيقي يقاس بابتسامة عملائنا ورضاهم الدائم.',
                    'desc_en' => 'Our true success is measured by lasting client satisfaction.',
                ],
                [
                    'icon' => 'CheckCircle2',
                    'title_ar' => 'الالتزام',
                    'title_en' => 'Commitment',
                    'desc_ar' => 'نسلم في الوقت المتفق عليه وفي حدود الميزانية المعتمدة.',
                    'desc_en' => 'We deliver on time and within the agreed budget.',
                ],
            ],
        ]]);
    }
}
