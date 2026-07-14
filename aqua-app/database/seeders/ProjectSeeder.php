<?php

namespace Database\Seeders;

use App\Models\Project;
use Illuminate\Database\Seeder;

/**
 * Seeds the real rows exported (read-only) from the live Supabase
 * projects table — see database/seeders/fixtures/projects_from_supabase.json.
 *
 * IDs are preserved exactly as exported. No other table currently
 * references projects.id, but this keeps the data real (not reset) and
 * consistent with how every other module's seeder works.
 *
 * Intentionally NOT run automatically on every deploy — run once manually
 * after the first migration, so a later redeploy can never clobber live
 * admin edits.
 */
class ProjectSeeder extends Seeder
{
    public function run(): void
    {
        $exported = json_decode(
            file_get_contents(__DIR__.'/fixtures/projects_from_supabase.json'),
            true,
        );

        foreach ($exported as $row) {
            Project::updateOrCreate(['id' => $row['id']], [
                'title_ar' => $row['title_ar'],
                'title_en' => $row['title_en'],
                'location_ar' => $row['location_ar'],
                'location_en' => $row['location_en'],
                'category' => $row['category'],
                'image_url' => $row['image_url'],
                'year' => $row['year'],
                'is_featured' => $row['is_featured'],
                'category_id' => $row['category_id'],
                'sort_order' => $row['sort_order'],
                'is_published' => $row['is_published'],
            ]);
        }
    }
}
