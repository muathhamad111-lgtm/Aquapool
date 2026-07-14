<?php

namespace Database\Seeders;

use App\Models\Service;
use Illuminate\Database\Seeder;

/**
 * Seeds the real rows exported (read-only) from the live Supabase
 * services table — see database/seeders/fixtures/services_from_supabase.json.
 *
 * IDs are preserved exactly as exported. No other table currently
 * references services.id, but this keeps the data real (not reset) and
 * consistent with how every other module's seeder works.
 *
 * Intentionally NOT run automatically on every deploy — run once manually
 * after the first migration, so a later redeploy can never clobber live
 * admin edits.
 */
class ServiceSeeder extends Seeder
{
    public function run(): void
    {
        $exported = json_decode(
            file_get_contents(__DIR__.'/fixtures/services_from_supabase.json'),
            true,
        );

        foreach ($exported as $row) {
            Service::updateOrCreate(['id' => $row['id']], [
                'icon' => $row['icon'],
                'title_ar' => $row['title_ar'],
                'title_en' => $row['title_en'],
                'description_ar' => $row['description_ar'],
                'description_en' => $row['description_en'],
                'category_id' => $row['category_id'],
                'sort_order' => $row['sort_order'],
                'is_published' => $row['is_published'],
            ]);
        }
    }
}
