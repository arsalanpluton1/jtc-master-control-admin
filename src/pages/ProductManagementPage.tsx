import { type ChangeEvent, type FormEvent, useEffect, useState } from "react";
import {
  createAdminProduct,
  getAdminProduct,
  getAdminProductCost,
  getAdminProducts,
  getAdminRecipes,
  productStatusOptions,
  productTypeOptions,
  updateAdminProduct,
  type AdminProduct,
  type AdminProductCost,
  type AdminRecipe,
  type CreateAdminProductInput,
} from "../api/admin";
import { EmptyState, ErrorState, LoadingState } from "../components/PageStates";

type ProductManagementPageProps = {
  pathname: string;
  onNavigate: (path: string) => void;
};

type ProductFormValues = {
  name: string;
  sku: string;
  type: string;
  status: string;
  price: string;
  laborCost: string;
  otherCost: string;
  category: string;
  recipeId: string;
  description: string;
};

const productCreatedMessageKey = "jtc-product-created-message";
const productUpdatedMessageKey = "jtc-product-updated-message";

export function ProductManagementPage({ pathname, onNavigate }: ProductManagementPageProps) {
  const normalizedPath = pathname.replace(/\/$/, "") || "/products";
  const isCreatePath = normalizedPath === "/products/new";
  const editMatch = normalizedPath.match(/^\/products\/([^/]+)\/edit$/);
  const detailMatch = normalizedPath.match(/^\/products\/([^/]+)$/);

  if (isCreatePath) {
    return <ProductFormPage mode="create" onNavigate={onNavigate} />;
  }

  if (editMatch?.[1]) {
    return <ProductEditPage productId={editMatch[1]} onNavigate={onNavigate} />;
  }

  if (detailMatch?.[1]) {
    return <ProductDetailPage productId={detailMatch[1]} onNavigate={onNavigate} />;
  }

  return <ProductListPage onNavigate={onNavigate} />;
}

function ProductListPage({ onNavigate }: { onNavigate: (path: string) => void }) {
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadProducts() {
      setIsLoading(true);
      setError(null);

      try {
        const data = await getAdminProducts();
        if (isMounted) {
          setProducts(data.products);
        }
      } catch (loadError) {
        if (isMounted) {
          setError(loadError instanceof Error ? loadError.message : "Unable to load products");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadProducts();
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="page-stack">
      <div className="resource-toolbar">
        <div>
          <p className="eyebrow">Admin Catalog Management</p>
          <h2>Product directory</h2>
        </div>
        <button type="button" onClick={() => onNavigate("/products/new")}>Create Product</button>
      </div>
      {isLoading ? <LoadingState title="Loading products" message="Fetching catalog items and recipe links..." /> : null}
      {error ? <ErrorState title="Products unavailable" message={error} /> : null}
      {!isLoading && !error && products.length === 0 ? (
        <EmptyState title="No products found" message="Create the first catalog product to make it available to later recipe and inventory flows." />
      ) : null}
      {!isLoading && !error && products.length > 0 ? <ProductTable products={products} onNavigate={onNavigate} /> : null}
    </div>
  );
}

function ProductTable({ products, onNavigate }: { products: AdminProduct[]; onNavigate: (path: string) => void }) {
  return (
    <section className="table-panel" aria-label="Products">
      <table className="data-table">
        <thead>
          <tr>
            <th scope="col">Product</th>
            <th scope="col">Category</th>
            <th scope="col">Type</th>
            <th scope="col">Price</th>
            <th scope="col">Product cost</th>
            <th scope="col">Recipe</th>
            <th scope="col">Status</th>
            <th scope="col">Details</th>
          </tr>
        </thead>
        <tbody>
          {products.map((product) => (
            <tr key={product._id}>
              <td><strong>{product.name}</strong><span>{product.sku}</span></td>
              <td>{product.category}</td>
              <td>{formatProductType(product.type)}</td>
              <td>{formatProductPrice(product.priceCents)}</td>
              <td>{formatProductCost(product.productCostCents)}</td>
              <td>{product.recipe ? `${product.recipe.name} (${product.recipe.code})` : "Not linked"}</td>
              <td><StatusBadge value={product.status} /></td>
              <td>
                <a href={`/products/${product._id}`} onClick={(event) => { event.preventDefault(); onNavigate(`/products/${product._id}`); }}>
                  View details
                </a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

function ProductEditPage({ productId, onNavigate }: { productId: string; onNavigate: (path: string) => void }) {
  const [product, setProduct] = useState<AdminProduct | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadProduct() {
      setIsLoading(true);
      setError(null);

      try {
        const data = await getAdminProduct(productId);
        if (isMounted) {
          setProduct(data.product);
        }
      } catch (loadError) {
        if (isMounted) {
          setError(loadError instanceof Error ? loadError.message : "Unable to load product");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadProduct();
    return () => {
      isMounted = false;
    };
  }, [productId]);

  return (
    <div className="page-stack">
      {isLoading ? <LoadingState title="Loading product" message="Preparing this product for editing..." /> : null}
      {error ? <ErrorState title="Product unavailable" message={error} /> : null}
      {!isLoading && !error && product ? <ProductFormPage mode="edit" product={product} onNavigate={onNavigate} /> : null}
    </div>
  );
}

function ProductFormPage({ mode, product, onNavigate }: { mode: "create" | "edit"; product?: AdminProduct; onNavigate: (path: string) => void }) {
  const [form, setForm] = useState<ProductFormValues>(() => productToForm(product));
  const [recipes, setRecipes] = useState<AdminRecipe[]>([]);
  const [recipeLoadError, setRecipeLoadError] = useState<string | null>(null);
  const [isLoadingRecipes, setIsLoadingRecipes] = useState(true);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadRecipes() {
      setIsLoadingRecipes(true);
      setRecipeLoadError(null);
      try {
        const data = await getAdminRecipes();
        if (isMounted) {
          setRecipes(data.recipes);
        }
      } catch (loadError) {
        if (isMounted) {
          setRecipeLoadError(loadError instanceof Error ? loadError.message : "Unable to load recipes");
        }
      } finally {
        if (isMounted) {
          setIsLoadingRecipes(false);
        }
      }
    }

    void loadRecipes();
    return () => {
      isMounted = false;
    };
  }, []);

  function updateField(event: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    setSubmitError(null);
    setFieldErrors((current) => {
      if (!current[name]) {
        return current;
      }
      const next = { ...current };
      delete next[name];
      return next;
    });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitError(null);
    const errors = validateProductForm(form);
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      return;
    }

    const input: CreateAdminProductInput = {
      name: form.name.trim(),
      sku: form.sku.trim().toUpperCase(),
      type: form.type as CreateAdminProductInput["type"],
      status: form.status as CreateAdminProductInput["status"],
      priceCents: Math.round(Number(form.price) * 100),
      laborCostCents: Math.round(Number(form.laborCost) * 100),
      otherCostCents: Math.round(Number(form.otherCost) * 100),
      category: form.category.trim(),
      description: form.description.trim() || undefined,
      recipeId: form.recipeId.trim() || undefined,
    };

    setIsSubmitting(true);
    try {
      const data = mode === "create" ? await createAdminProduct(input) : await updateAdminProduct(product!._id, input);
      sessionStorage.setItem(mode === "create" ? productCreatedMessageKey : productUpdatedMessageKey, `${data.product.name} was ${mode === "create" ? "created" : "updated"} successfully.`);
      onNavigate(`/products/${data.product._id}`);
    } catch (createError) {
      setSubmitError(createError instanceof Error ? createError.message : mode === "create" ? "Unable to create product" : "Unable to update product");
    } finally {
      setIsSubmitting(false);
    }
  }

  const selectedRecipe = recipes.find((recipeOption) => recipeOption._id === form.recipeId);
  const ingredientCostPreviewCents = selectedRecipe?.costPerYieldCents ?? null;
  const laborCostPreviewCents = parseProductCostInput(form.laborCost);
  const otherCostPreviewCents = parseProductCostInput(form.otherCost);
  const productCostPreviewCents = ingredientCostPreviewCents !== null && laborCostPreviewCents !== null && otherCostPreviewCents !== null
    ? ingredientCostPreviewCents + laborCostPreviewCents + otherCostPreviewCents
    : null;
  const sellingPricePreviewCents = parseProductCostInput(form.price);

  return (
    <div className="page-stack">
      <div className="resource-toolbar">
        <div>
          <p className="eyebrow">Admin Catalog Management</p>
          <h2>{mode === "create" ? "Create product" : `Edit ${product?.name ?? "product"}`}</h2>
        </div>
        <button type="button" className="secondary-button" onClick={() => onNavigate("/products")}>Back to Products</button>
      </div>
      {submitError ? <ErrorState title="Product not saved" message={submitError} /> : null}
      {recipeLoadError ? <ErrorState title="Recipe options unavailable" message={recipeLoadError} /> : null}
      <form className="store-form" onSubmit={handleSubmit} noValidate>
        <section aria-label="Product details">
          <h3>Product details</h3>
          <div className="form-grid">
            <ProductField label="Product name" name="name" value={form.name} onChange={updateField} error={fieldErrors.name} required />
            <ProductField label="SKU" name="sku" value={form.sku} onChange={updateField} error={fieldErrors.sku} required />
            <ProductField label="Category" name="category" value={form.category} onChange={updateField} error={fieldErrors.category} required />
            <label className="form-field"><span>Product type *</span><select name="type" value={form.type} onChange={updateField}>{productTypeOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select>{fieldErrors.type ? <small>{fieldErrors.type}</small> : null}</label>
            <label className="form-field"><span>Status *</span><select name="status" value={form.status} onChange={updateField}>{productStatusOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
            <ProductField label="Price" name="price" type="number" min="0" step="0.01" value={form.price} onChange={updateField} error={fieldErrors.price} required />
            <ProductField label="Labor cost" name="laborCost" type="number" min="0" step="0.01" value={form.laborCost} onChange={updateField} error={fieldErrors.laborCost} required />
            <ProductField label="Other cost" name="otherCost" type="number" min="0" step="0.01" value={form.otherCost} onChange={updateField} error={fieldErrors.otherCost} required />
          </div>
          <p className="form-hint">Enter selling price, labor cost, and other applicable cost in dollars. Values are stored as cents for consistent calculations.</p>
        </section>
        <section aria-label="Product relationships">
          <h3>Catalog relationships</h3>
          <div className="form-grid">
            <label className="form-field"><span>Recipe</span><select name="recipeId" value={form.recipeId} onChange={updateField}><option value="">No recipe linked</option>{recipes.map((recipeOption) => <option key={recipeOption._id} value={recipeOption._id}>{recipeOption.name} ({recipeOption.code}) · {formatRecipeCost(recipeOption.costPerYieldCents)}</option>)}</select>{fieldErrors.recipeId ? <small role="alert">{fieldErrors.recipeId}</small> : null}</label>
          </div>
          <p className="form-hint">The linked recipe ingredient cost is combined with labor and other cost to calculate final product cost. {isLoadingRecipes ? "Loading recipe options..." : ""}</p>
        </section>
        <section className="related-panel" aria-label="Product cost breakdown">
          <h3>Product cost breakdown</h3>
          <div className="detail-panel">
            <div><span>Recipe ingredient cost</span><strong>{formatProductCost(ingredientCostPreviewCents)}</strong></div>
            <div><span>Labor cost</span><strong>{formatProductCost(laborCostPreviewCents)}</strong></div>
            <div><span>Other cost</span><strong>{formatProductCost(otherCostPreviewCents)}</strong></div>
            <div><span>Calculated product cost</span><strong>{formatProductCost(productCostPreviewCents)}</strong></div>
            <div><span>Selling price (separate)</span><strong>{formatProductCost(sellingPricePreviewCents)}</strong></div>
          </div>
          <p className="form-hint">Preview only. The backend recalculates and returns the authoritative product cost when the product is saved.</p>
          {selectedRecipe && selectedRecipe.costStatus !== "calculated" ? <p className="form-hint">{formatProductCostStatus("incomplete_recipe")}</p> : null}
        </section>
        <section aria-label="Product description">
          <h3>Description</h3>
          <label className="form-field"><span>Description</span><textarea name="description" maxLength={1000} value={form.description} onChange={updateField} placeholder="Optional product description" /></label>
        </section>
        {Object.keys(fieldErrors).length > 0 ? <p className="form-hint" role="alert">Please correct the highlighted product fields before submitting.</p> : null}
        <div className="form-actions">
          <button type="button" className="secondary-button" onClick={() => onNavigate("/products")}>Cancel</button>
          <button type="submit" disabled={isSubmitting}>{isSubmitting ? "Saving..." : mode === "create" ? "Create Product" : "Save Product"}</button>
        </div>
      </form>
    </div>
  );
}

function ProductDetailPage({ productId, onNavigate }: { productId: string; onNavigate: (path: string) => void }) {
  const [product, setProduct] = useState<AdminProduct | null>(null);
  const [cost, setCost] = useState<AdminProductCost | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const createdMessage = sessionStorage.getItem(productCreatedMessageKey);
    const updatedMessage = sessionStorage.getItem(productUpdatedMessageKey);
    const messageKey = createdMessage ? productCreatedMessageKey : productUpdatedMessageKey;
    setSuccessMessage(createdMessage ?? updatedMessage);
    if (createdMessage || updatedMessage) {
      sessionStorage.removeItem(messageKey);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function loadProduct() {
      setIsLoading(true);
      setError(null);
      try {
        const [data, costData] = await Promise.all([getAdminProduct(productId), getAdminProductCost(productId)]);
        if (isMounted) {
          setProduct(data.product);
          setCost(costData.productCost);
        }
      } catch (loadError) {
        if (isMounted) {
          setError(loadError instanceof Error ? loadError.message : "Unable to load product");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadProduct();
    return () => {
      isMounted = false;
    };
  }, [productId]);

  return (
    <div className="page-stack">
      <div className="resource-toolbar">
        <div><p className="eyebrow">Admin Catalog Management</p><h2>Product details</h2></div>
        <div className="form-actions"><button type="button" className="secondary-button" onClick={() => onNavigate("/products")}>Back to Products</button>{product ? <button type="button" onClick={() => onNavigate(`/products/${product._id}/edit`)}>Edit Product</button> : null}</div>
      </div>
      {isLoading ? <LoadingState title="Loading product" message="Fetching product details..." /> : null}
      {error ? <ErrorState title="Product unavailable" message={error} /> : null}
      {successMessage ? <section className="state-panel" role="status"><div><h2>Product saved</h2><p>{successMessage}</p></div></section> : null}
      {!isLoading && !error && product && cost ? <ProductDetailPanel product={product} cost={cost} /> : null}
    </div>
  );
}

function ProductDetailPanel({ product, cost }: { product: AdminProduct; cost: AdminProductCost }) {
  const details = [
    ["Product name", product.name],
    ["SKU", product.sku],
    ["Category", product.category],
    ["Type", formatProductType(product.type)],
    ["Status", formatProductStatus(product.status)],
    ["Selling price", formatProductPrice(product.priceCents)],
    ["Ingredient cost", formatProductCost(product.ingredientCostCents)],
    ["Labor cost", formatProductPrice(product.laborCostCents)],
    ["Other cost", formatProductPrice(product.otherCostCents)],
    ["Product cost", formatProductCost(product.productCostCents)],
    ["Recipe", product.recipe ? `${product.recipe.name} (${product.recipe.code}) · ${formatProductStatus(product.recipe.status)}` : "Not linked"],
  ];

  return (
    <>
      <section className="detail-panel" aria-label="Product summary">
        {details.map(([label, value]) => <div key={label}><span>{label}</span><strong>{value}</strong></div>)}
      </section>
      <section className="related-panel" aria-label="Pricing and P and L">
        <h3>Pricing and P&amp;L</h3>
        <div className="detail-panel">
          <div><span>Selling price</span><strong>{formatProductCost(cost.sellingPriceCents)}</strong></div>
          <div><span>Product cost</span><strong>{formatProductCost(cost.productCostCents)}</strong></div>
          <div><span>Gross margin per unit</span><strong>{formatProductCost(cost.grossMarginCents)}</strong></div>
          <div><span>Gross margin percentage</span><strong>{formatProductPercentage(cost.grossMarginPercent)}</strong></div>
        </div>
        <p className="form-hint">These values are calculated from the current selling price and authoritative product cost for pricing and downstream P&amp;L use.</p>
      </section>
      <section className="related-panel" aria-label="Product description">
        <h3>Description</h3>
        <p>{product.description || "No description has been added."}</p>
        {product.costStatus !== "calculated" ? <p className="form-hint">{formatProductCostStatus(product.costStatus)}</p> : null}
      </section>
    </>
  );
}

function ProductField({ label, name, value, onChange, error, required, type = "text", min, step }: { label: string; name: string; value: string; onChange: (event: ChangeEvent<HTMLInputElement>) => void; error?: string; required?: boolean; type?: string; min?: string; step?: string }) {
  return (
    <label className="form-field">
      <span>{label}{required ? " *" : ""}</span>
      <input name={name} type={type} min={min} step={step} value={value} onChange={onChange} required={required} />
      {error ? <small role="alert">{error}</small> : null}
    </label>
  );
}

function productToForm(product?: AdminProduct): ProductFormValues {
  return {
    name: product?.name ?? "",
    sku: product?.sku ?? "",
    type: product?.type ?? "prepared_item",
    status: product?.status ?? "draft",
    price: product ? (product.priceCents / 100).toFixed(2) : "",
    laborCost: product ? (product.laborCostCents / 100).toFixed(2) : "0.00",
    otherCost: product ? (product.otherCostCents / 100).toFixed(2) : "0.00",
    category: product?.category ?? "",
    recipeId: product?.recipeId ?? "",
    description: product?.description ?? "",
  };
}

function validateProductForm(form: ProductFormValues) {
  const errors: Record<string, string> = {};
  if (form.name.trim().length < 2 || form.name.trim().length > 160) errors.name = "Name must be between 2 and 160 characters.";
  if (!/^[A-Za-z0-9_.-]{2,64}$/.test(form.sku.trim())) errors.sku = "Use 2–64 letters, numbers, underscores, periods, or hyphens.";
  if (!form.category.trim() || form.category.trim().length > 80) errors.category = "Category is required and must be 80 characters or fewer.";
  if (!productTypeOptions.some((option) => option.value === form.type)) errors.type = "Select a supported product type.";
  if (!productStatusOptions.some((option) => option.value === form.status)) errors.status = "Select a supported product status.";
  const price = Number(form.price);
  if (!Number.isFinite(price) || price < 0) errors.price = "Price must be 0 or greater.";
  const laborCost = Number(form.laborCost);
  if (!Number.isFinite(laborCost) || laborCost < 0) errors.laborCost = "Labor cost must be 0 or greater.";
  const otherCost = Number(form.otherCost);
  if (!Number.isFinite(otherCost) || otherCost < 0) errors.otherCost = "Other cost must be 0 or greater.";
  if (form.recipeId.trim() && !/^[a-fA-F0-9]{24}$/.test(form.recipeId.trim())) errors.recipeId = "Recipe ID must be a valid MongoDB ID.";
  return errors;
}

function formatProductPrice(priceCents: number) {
  return `$${(priceCents / 100).toFixed(2)}`;
}

function formatProductCost(cents: number | null) {
  return cents === null ? "Unavailable" : `$${(cents / 100).toFixed(2)}`;
}

function formatProductPercentage(value: number | null) {
  return value === null ? "Unavailable" : `${value.toFixed(2)}%`;
}

function parseProductCostInput(value: string) {
  const dollars = Number(value);
  return Number.isFinite(dollars) && dollars >= 0 ? Math.round(dollars * 100) : null;
}

function formatRecipeCost(cents: number | null) {
  return cents === null ? "cost unavailable" : `$${(cents / 100).toFixed(2)} / yield`;
}

function formatProductCostStatus(value: string) {
  if (value === "missing_recipe") return "Link a recipe to calculate ingredient and product cost.";
  return "Product cost is unavailable because the linked recipe cost is incomplete.";
}

function formatProductType(value: string) {
  return productTypeOptions.find((option) => option.value === value)?.label ?? formatProductValue(value);
}

function formatProductStatus(value: string) {
  return productStatusOptions.find((option) => option.value === value)?.label ?? formatProductValue(value);
}

function formatProductValue(value: string) {
  return value.split("_").map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(" ");
}

function StatusBadge({ value }: { value: string }) {
  return <span className={`status-badge status-badge-${value}`}>{formatProductValue(value)}</span>;
}
