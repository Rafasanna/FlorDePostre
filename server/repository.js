const numberOrNull = (v) => (v === null ? null : Number(v));
export async function readCatalog(sql) {
  // Una sentencia = una instantánea coherente (productos, relaciones y revisión).
  const [row] = await sql`SELECT
   (SELECT revision FROM catalog_state WHERE id=1) AS revision,
   coalesce((SELECT jsonb_agg(to_jsonb(c) ORDER BY display_order,id) FROM categories c),'[]') AS categories,
   coalesce((SELECT jsonb_agg(to_jsonb(p) ORDER BY display_order,id) FROM products p),'[]') AS products,
   coalesce((SELECT jsonb_agg(to_jsonb(s) ORDER BY display_order,id) FROM postre_sizes s),'[]') AS sizes,
   coalesce((SELECT jsonb_agg(to_jsonb(v) ORDER BY display_order,size_id) FROM product_variants v),'[]') AS variants,
   coalesce((SELECT jsonb_agg(to_jsonb(i) ORDER BY display_order) FROM (SELECT pi.*,i.public_id,i.url FROM product_images pi JOIN images i ON i.id=pi.image_id) i),'[]') AS images,
   coalesce((SELECT jsonb_agg(to_jsonb(a) ORDER BY created_at,id) FROM images a),'[]') AS assets,
   coalesce((SELECT jsonb_agg(data ORDER BY display_order,id) FROM campaigns),'[]') AS campaigns,
   coalesce((SELECT jsonb_agg(to_jsonb(d) ORDER BY display_order,id) FROM cake_datasets d),'[]') AS cake,
   coalesce((SELECT rules FROM pricing_rule_versions WHERE active),'{}') AS rules`;
  return {
    revision: row.revision,
    assets: row.assets.map((a) => ({
      id: a.id,
      url: a.url,
      publicId: a.public_id,
      alt: "",
      width: a.width,
      height: a.height,
      bytes: numberOrNull(a.bytes),
      format: a.format,
    })),
    categories: row.categories.map((c) => ({
      id: c.id,
      name: c.name,
      parentId: c.parent_id,
      order: c.display_order,
      active: c.active,
    })),
    sizes: row.sizes.map((s) => ({
      id: s.id,
      name: s.name,
      portions: s.portions,
      active: s.active,
      estimatedPriceCents: numberOrNull(s.estimated_price_cents),
      notes: s.notes,
    })),
    campaigns: row.campaigns,
    cake: row.cake,
    rules: row.rules,
    products: row.products.map((p) => ({
      id: p.id,
      kind: p.kind,
      name: p.name,
      description: p.description,
      categoryId: p.category_id,
      campaignId: p.campaign_id,
      priceCents: numberOrNull(p.price_cents),
      offerPriceCents: numberOrNull(p.offer_price_cents),
      previousPriceCents: numberOrNull(p.previous_price_cents),
      active: p.active,
      archived: p.archived,
      featured: p.featured,
      reserved: p.reserved,
      campaignActive: p.campaign_active,
      sourceRecord: p.source_record,
      sinTacc: p.sin_tacc,
      limited: p.limited,
      stock: p.stock,
      label: p.label,
      offerLabel: p.offer_label,
      startDate: p.start_date,
      endDate: p.end_date,
      order: p.display_order,
      variants: row.variants
        .filter((v) => v.product_id === p.id)
        .map((v) => ({
          sizeId: v.size_id,
          priceCents: Number(v.price_cents),
          active: v.active,
        })),
      images: row.images
        .filter((i) => i.product_id === p.id)
        .map((i) => ({
          id: i.image_id,
          url: i.url,
          publicId: i.public_id,
          alt: i.alt,
        })),
    })),
  };
}
export async function saveProduct(sql, product, revision, creating, actor) {
  const [r] =
    await sql`SELECT admin_save_product(${JSON.stringify(product)}::jsonb,${revision},${creating},${actor}::uuid) AS revision`;
  return r.revision;
}
export async function saveCategory(sql, category, revision, creating, actor) {
  const [r] =
    await sql`SELECT admin_save_category(${JSON.stringify(category)}::jsonb,${revision},${creating},${actor}::uuid) AS revision`;
  return r.revision;
}
