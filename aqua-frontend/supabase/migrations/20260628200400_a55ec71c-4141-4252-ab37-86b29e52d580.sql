
create policy "Public can view site assets"
  on storage.objects for select to anon, authenticated
  using (bucket_id = 'site-assets');

create policy "Admins can upload site assets"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'site-assets' and public.has_role(auth.uid(), 'admin'));

create policy "Admins can update site assets"
  on storage.objects for update to authenticated
  using (bucket_id = 'site-assets' and public.has_role(auth.uid(), 'admin'));

create policy "Admins can delete site assets"
  on storage.objects for delete to authenticated
  using (bucket_id = 'site-assets' and public.has_role(auth.uid(), 'admin'));
