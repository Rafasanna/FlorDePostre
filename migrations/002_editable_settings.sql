-- Aplicar manualmente después de 001. No modifica datos existentes.
BEGIN;
CREATE OR REPLACE FUNCTION admin_save_settings(p jsonb, expected integer, actor uuid) RETURNS integer LANGUAGE plpgsql AS $$
DECLARE rev integer; item jsonb; dataset_name text; position integer; current_rules jsonb;
BEGIN
 SELECT revision INTO rev FROM catalog_state WHERE id=1 FOR UPDATE;
 IF rev <> expected THEN RAISE EXCEPTION 'Catalog revision conflict' USING ERRCODE='40001'; END IF;
 position := 0;
 FOR item IN SELECT value FROM jsonb_array_elements(p->'sizes') LOOP
  INSERT INTO postre_sizes(id,name,portions,active,estimated_price_cents,notes,display_order)
  VALUES(item->>'id',item->>'name',item->>'portions',(item->>'active')::boolean,(item->>'estimatedPriceCents')::bigint,item->>'notes',(item->>'order')::integer)
  ON CONFLICT(id) DO UPDATE SET name=excluded.name,portions=excluded.portions,active=excluded.active,estimated_price_cents=excluded.estimated_price_cents,notes=excluded.notes,display_order=excluded.display_order;
  position := position+1;
 END LOOP;
 FOR dataset_name IN SELECT unnest(ARRAY['tortaTamanos','tortaCoberturas','tortaRellenos','tortaExtras']) LOOP
  position := 0;
  FOR item IN SELECT value FROM jsonb_array_elements(p->'cake'->dataset_name) LOOP
   INSERT INTO cake_datasets(dataset,id,data,display_order) VALUES(dataset_name,item->>'id',item,position)
   ON CONFLICT(dataset,id) DO UPDATE SET data=excluded.data,display_order=excluded.display_order;
   position := position+1;
  END LOOP;
 END LOOP;
 position := 0;
 FOR item IN SELECT value FROM jsonb_array_elements(p->'campaigns') LOOP
  INSERT INTO campaigns(id,name,data,display_order) VALUES(item->>'id',item->>'evento',item,position)
  ON CONFLICT(id) DO UPDATE SET name=excluded.name,data=excluded.data,display_order=excluded.display_order;
  position := position+1;
 END LOOP;
 SELECT rules INTO current_rules FROM pricing_rule_versions WHERE active;
 IF current_rules IS DISTINCT FROM p->'rules' THEN
  UPDATE pricing_rule_versions SET active=false WHERE active;
  INSERT INTO pricing_rule_versions(id,rules,active) VALUES('settings-r'||(rev+1)::text,p->'rules',true);
 END IF;
 INSERT INTO audit_log(admin_id,action,detail) VALUES(actor,'settings.save',jsonb_build_object('previousRevision',expected));
 UPDATE catalog_state SET revision=revision+1,updated_at=now() WHERE id=1 RETURNING revision INTO rev;
 RETURN rev;
END $$;
INSERT INTO schema_migrations(version) VALUES('002_editable_settings') ON CONFLICT DO NOTHING;
COMMIT;
