-- Manual solamente. Sin conexión implícita ni ejecución durante build.
BEGIN;
CREATE TABLE IF NOT EXISTS schema_migrations (version text PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE IF NOT EXISTS admins (
 id uuid PRIMARY KEY, email text NOT NULL UNIQUE CHECK(email = lower(email)),
 password_hash text NOT NULL CHECK(password_hash LIKE 'scrypt$%'), active boolean NOT NULL DEFAULT true,
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS admin_sessions (
 token_hash text PRIMARY KEY, admin_id uuid NOT NULL REFERENCES admins(id),
 expires_at timestamptz NOT NULL, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS admin_sessions_expiry ON admin_sessions(expires_at);
CREATE TABLE IF NOT EXISTS login_limits (
 key text PRIMARY KEY, attempts integer NOT NULL CHECK(attempts > 0), expires_at timestamptz NOT NULL
);
CREATE INDEX IF NOT EXISTS login_limits_expiry ON login_limits(expires_at);
CREATE TABLE IF NOT EXISTS audit_log (
 id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY, admin_id uuid REFERENCES admins(id),
 action text NOT NULL, entity_id text, detail jsonb NOT NULL DEFAULT '{}', created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS audit_log_created ON audit_log(created_at DESC);
CREATE TABLE IF NOT EXISTS catalog_state (
 id integer PRIMARY KEY CHECK(id = 1), revision integer NOT NULL DEFAULT 0, updated_at timestamptz NOT NULL DEFAULT now()
);
INSERT INTO catalog_state(id) VALUES(1) ON CONFLICT DO NOTHING;
CREATE TABLE IF NOT EXISTS categories (
 id text PRIMARY KEY CHECK(id ~ '^[a-zA-Z0-9][a-zA-Z0-9._-]{0,119}$'), name text NOT NULL CHECK(length(trim(name)) BETWEEN 1 AND 120),
 parent_id text REFERENCES categories(id), display_order integer NOT NULL DEFAULT 0 CHECK(display_order >= 0), active boolean NOT NULL DEFAULT true,
 CHECK(parent_id IS NULL OR parent_id <> id)
);
CREATE UNIQUE INDEX IF NOT EXISTS categories_unique_root ON categories(lower(name)) WHERE parent_id IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS categories_unique_child ON categories(parent_id,lower(name)) WHERE parent_id IS NOT NULL;
CREATE OR REPLACE FUNCTION check_category_depth() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF NEW.parent_id IS NOT NULL AND (EXISTS(SELECT 1 FROM categories WHERE id=NEW.parent_id AND parent_id IS NOT NULL) OR EXISTS(SELECT 1 FROM categories WHERE parent_id=NEW.id)) THEN
 RAISE EXCEPTION 'Only one subcategory level is supported' USING ERRCODE='23514'; END IF;
 RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS categories_depth ON categories;
CREATE TRIGGER categories_depth BEFORE INSERT OR UPDATE ON categories FOR EACH ROW EXECUTE FUNCTION check_category_depth();
CREATE TABLE IF NOT EXISTS campaigns (
 id text PRIMARY KEY, name text NOT NULL UNIQUE, data jsonb NOT NULL, display_order integer NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS postre_sizes (
 id text PRIMARY KEY, name text NOT NULL, portions text NOT NULL DEFAULT '', active boolean NOT NULL DEFAULT true,
 estimated_price_cents bigint CHECK(estimated_price_cents > 0), notes text NOT NULL DEFAULT '', display_order integer NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS products (
 id text PRIMARY KEY CHECK(id ~ '^[a-zA-Z0-9][a-zA-Z0-9._-]{0,119}$'),
 CHECK(id <> 'torta-personalizada'),
 kind text NOT NULL CHECK(kind IN ('daily','sin_tacc','postre','special')),
 name text NOT NULL CHECK(length(trim(name)) BETWEEN 1 AND 160), description text NOT NULL DEFAULT '' CHECK(length(description)<=5000),
 category_id text NOT NULL REFERENCES categories(id), campaign_id text REFERENCES campaigns(id),
 price_cents bigint CHECK(price_cents BETWEEN 1 AND 10000000000),
 offer_price_cents bigint CHECK(offer_price_cents BETWEEN 1 AND 10000000000), previous_price_cents bigint CHECK(previous_price_cents BETWEEN 1 AND 10000000000),
 active boolean NOT NULL DEFAULT false, archived boolean NOT NULL DEFAULT false, featured boolean NOT NULL DEFAULT false,
 reserved boolean NOT NULL DEFAULT false, campaign_active boolean NOT NULL DEFAULT true, sin_tacc boolean NOT NULL DEFAULT false, limited boolean NOT NULL DEFAULT false,
 stock integer CHECK(stock >= 0), label text NOT NULL DEFAULT '', offer_label text NOT NULL DEFAULT '',
 start_date date, end_date date, display_order integer NOT NULL DEFAULT 0 CHECK(display_order BETWEEN 0 AND 1000000),
 source_record jsonb NOT NULL DEFAULT '{}', updated_at timestamptz NOT NULL DEFAULT now(),
 CHECK((kind = 'postre' AND price_cents IS NULL AND offer_price_cents IS NULL AND previous_price_cents IS NULL) OR (kind <> 'postre' AND price_cents IS NOT NULL)),
 CHECK((kind = 'special') = (campaign_id IS NOT NULL)),
 CHECK(start_date IS NULL OR end_date IS NULL OR start_date <= end_date),
 CHECK(offer_price_cents IS NULL OR offer_price_cents <= price_cents),
 CHECK(previous_price_cents IS NULL OR previous_price_cents >= coalesce(offer_price_cents,price_cents))
);
CREATE INDEX IF NOT EXISTS products_listing ON products(category_id,archived,active,display_order);
CREATE INDEX IF NOT EXISTS products_featured ON products(display_order) WHERE featured AND active AND NOT archived;
CREATE INDEX IF NOT EXISTS products_campaign ON products(campaign_id) WHERE campaign_id IS NOT NULL;
CREATE TABLE IF NOT EXISTS product_variants (
 product_id text NOT NULL REFERENCES products(id), size_id text NOT NULL REFERENCES postre_sizes(id),
 price_cents bigint NOT NULL CHECK(price_cents BETWEEN 1 AND 10000000000), active boolean NOT NULL DEFAULT true,
 display_order integer NOT NULL DEFAULT 0, PRIMARY KEY(product_id,size_id)
);
CREATE TABLE IF NOT EXISTS images (
 id text PRIMARY KEY, public_id text UNIQUE, url text NOT NULL CHECK(url ~ '^(https://|/images/)'),
 width integer CHECK(width > 0), height integer CHECK(height > 0), bytes bigint CHECK(bytes > 0), format text,
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS product_images (
 product_id text NOT NULL REFERENCES products(id), image_id text NOT NULL REFERENCES images(id),
 alt text NOT NULL DEFAULT '' CHECK(length(alt)<=240), display_order integer NOT NULL CHECK(display_order >= 0),
 PRIMARY KEY(product_id,image_id), UNIQUE(product_id,display_order)
);
-- Principal = menor display_order; no puede haber dos principales ni posiciones repetidas.
CREATE TABLE IF NOT EXISTS cake_datasets (
 dataset text NOT NULL CHECK(dataset IN ('tortaTamanos','tortaCoberturas','tortaRellenos','tortaExtras')),
 id text NOT NULL, data jsonb NOT NULL, display_order integer NOT NULL DEFAULT 0, PRIMARY KEY(dataset,id)
);
CREATE TABLE IF NOT EXISTS pricing_rule_versions (
 id text PRIMARY KEY, rules jsonb NOT NULL, created_at timestamptz NOT NULL DEFAULT now(), active boolean NOT NULL DEFAULT false
);
CREATE UNIQUE INDEX IF NOT EXISTS one_active_rule_version ON pricing_rule_versions(active) WHERE active;
CREATE TABLE IF NOT EXISTS import_runs (
 id uuid PRIMARY KEY, snapshot_hash text NOT NULL UNIQUE, manifest jsonb NOT NULL, created_at timestamptz NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION admin_save_product(p jsonb, expected integer, creating boolean, actor uuid) RETURNS integer LANGUAGE plpgsql AS $$
DECLARE current_revision integer; img jsonb; v jsonb; n integer := 0; resulting_revision integer;
BEGIN
 SELECT revision INTO current_revision FROM catalog_state WHERE id=1 FOR UPDATE;
 IF current_revision <> expected THEN RAISE EXCEPTION 'Catalog revision conflict' USING ERRCODE='40001'; END IF;
 IF creating THEN
  INSERT INTO products(id,kind,name,category_id,price_cents,campaign_id) VALUES(p->>'id',p->>'kind',p->>'name',p->>'categoryId',(p->>'priceCents')::bigint,p->>'campaignId');
 ELSE
  IF NOT EXISTS(SELECT 1 FROM products WHERE id=p->>'id' AND kind=p->>'kind') THEN RAISE EXCEPTION 'Product not found' USING ERRCODE='23503'; END IF;
 END IF;
 UPDATE products SET name=p->>'name',description=p->>'description',category_id=p->>'categoryId',campaign_id=p->>'campaignId',price_cents=(p->>'priceCents')::bigint,
 offer_price_cents=(p->>'offerPriceCents')::bigint,previous_price_cents=(p->>'previousPriceCents')::bigint,
 active=(p->>'active')::boolean,archived=(p->>'archived')::boolean,featured=(p->>'featured')::boolean,reserved=(p->>'reserved')::boolean,campaign_active=(p->>'campaignActive')::boolean,
 sin_tacc=(p->>'sinTacc')::boolean,limited=(p->>'limited')::boolean,stock=(p->>'stock')::integer,label=p->>'label',offer_label=p->>'offerLabel',
 start_date=(p->>'startDate')::date,end_date=(p->>'endDate')::date,display_order=(p->>'order')::integer,updated_at=now() WHERE id=p->>'id';
 DELETE FROM product_variants WHERE product_id=p->>'id';
 FOR v IN SELECT value FROM jsonb_array_elements(p->'variants') LOOP
  IF p->>'kind' <> 'postre' THEN RAISE EXCEPTION 'Only postres have size variants' USING ERRCODE='23514'; END IF;
  INSERT INTO product_variants(product_id,size_id,price_cents,active,display_order) VALUES(p->>'id',v->>'sizeId',(v->>'priceCents')::bigint,(v->>'active')::boolean,n); n:=n+1;
 END LOOP;
 IF p->>'kind'='postre' AND (p->>'active')::boolean AND NOT (p->>'archived')::boolean AND NOT EXISTS(SELECT 1 FROM product_variants v JOIN postre_sizes s ON s.id=v.size_id WHERE v.product_id=p->>'id' AND v.active AND s.active) THEN RAISE EXCEPTION 'Active postre needs a variant' USING ERRCODE='23514'; END IF;
 DELETE FROM product_images WHERE product_id=p->>'id'; n:=0;
 FOR img IN SELECT value FROM jsonb_array_elements(p->'images') LOOP
  INSERT INTO images(id,public_id,url) VALUES(img->>'id',img->>'publicId',img->>'url') ON CONFLICT(id) DO NOTHING;
  IF NOT EXISTS(SELECT 1 FROM images WHERE id=img->>'id' AND url=img->>'url' AND public_id IS NOT DISTINCT FROM img->>'publicId') THEN RAISE EXCEPTION 'Asset identity conflict' USING ERRCODE='23514'; END IF;
  INSERT INTO product_images(product_id,image_id,alt,display_order) VALUES(p->>'id',img->>'id',img->>'alt',n); n:=n+1;
 END LOOP;
 INSERT INTO audit_log(admin_id,action,entity_id,detail) VALUES(actor,CASE WHEN creating THEN 'product.create' ELSE 'product.update' END,p->>'id',jsonb_build_object('archived',p->'archived','previousRevision',expected));
 UPDATE catalog_state SET revision=revision+1,updated_at=now() WHERE id=1 RETURNING revision INTO resulting_revision;
 RETURN resulting_revision;
END $$;

CREATE OR REPLACE FUNCTION admin_save_category(c jsonb, expected integer, creating boolean, actor uuid) RETURNS integer LANGUAGE plpgsql AS $$
DECLARE rev integer;
BEGIN
 SELECT revision INTO rev FROM catalog_state WHERE id=1 FOR UPDATE;
 IF rev <> expected THEN RAISE EXCEPTION 'Catalog revision conflict' USING ERRCODE='40001'; END IF;
 IF creating THEN INSERT INTO categories(id,name,parent_id,display_order,active) VALUES(c->>'id',c->>'name',c->>'parentId',(c->>'order')::integer,(c->>'active')::boolean);
 ELSE
  UPDATE categories SET name=c->>'name',parent_id=c->>'parentId',display_order=(c->>'order')::integer,active=(c->>'active')::boolean WHERE id=c->>'id';
  IF NOT FOUND THEN RAISE EXCEPTION 'Category not found' USING ERRCODE='23503'; END IF;
 END IF;
 INSERT INTO audit_log(admin_id,action,entity_id) VALUES(actor,'category.save',c->>'id');
 UPDATE catalog_state SET revision=revision+1,updated_at=now() WHERE id=1 RETURNING revision INTO rev; RETURN rev;
END $$;
INSERT INTO schema_migrations(version) VALUES('001_admin_catalog') ON CONFLICT DO NOTHING;
COMMIT;
