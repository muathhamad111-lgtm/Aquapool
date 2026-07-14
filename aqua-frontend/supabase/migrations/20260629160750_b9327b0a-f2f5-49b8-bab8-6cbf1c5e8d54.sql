-- Generalize product_categories to support categories for products, services and projects.
ALTER TABLE public.product_categories
  ADD COLUMN IF NOT EXISTS kind text NOT NULL DEFAULT 'product';

-- Constrain to known kinds
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'product_categories_kind_check'
  ) THEN
    ALTER TABLE public.product_categories
      ADD CONSTRAINT product_categories_kind_check
      CHECK (kind IN ('product','service','project'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS product_categories_kind_idx ON public.product_categories(kind);

-- Ensure a parent and its child share the same kind
CREATE OR REPLACE FUNCTION public.product_categories_check_parent_kind()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  parent_kind text;
BEGIN
  IF NEW.parent_id IS NOT NULL THEN
    SELECT kind INTO parent_kind FROM public.product_categories WHERE id = NEW.parent_id;
    IF parent_kind IS NULL THEN
      RAISE EXCEPTION 'Parent category not found';
    END IF;
    NEW.kind := parent_kind;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS product_categories_inherit_kind ON public.product_categories;
CREATE TRIGGER product_categories_inherit_kind
BEFORE INSERT OR UPDATE OF parent_id, kind ON public.product_categories
FOR EACH ROW EXECUTE FUNCTION public.product_categories_check_parent_kind();