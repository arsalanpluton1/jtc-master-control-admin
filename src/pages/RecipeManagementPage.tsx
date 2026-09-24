import { type ChangeEvent, type FormEvent, useEffect, useState } from "react";
import {
  createAdminRecipe,
  getAdminInventory,
  getAdminRecipe,
  getAdminRecipes,
  inventoryUnitOptions,
  recipeStatusOptions,
  updateAdminRecipe,
  type AdminInventoryItem,
  type AdminRecipe,
  type CreateAdminRecipeInput,
} from "../api/admin";
import { EmptyState, ErrorState, LoadingState } from "../components/PageStates";

type RecipeManagementPageProps = {
  pathname: string;
  onNavigate: (path: string) => void;
};

type IngredientFormValues = {
  inventoryItemId: string;
  quantity: string;
  unit: string;
  preparationNote: string;
};

type RecipeFormValues = {
  name: string;
  code: string;
  status: string;
  version: string;
  yieldQuantity: string;
  yieldUnit: string;
  ingredients: IngredientFormValues[];
};

const recipeCreatedMessageKey = "jtc-recipe-created-message";
const recipeUpdatedMessageKey = "jtc-recipe-updated-message";

export function RecipeManagementPage({ pathname, onNavigate }: RecipeManagementPageProps) {
  const normalizedPath = pathname.replace(/\/$/, "") || "/recipes";
  const isCreatePath = normalizedPath === "/recipes/new";
  const editMatch = normalizedPath.match(/^\/recipes\/([^/]+)\/edit$/);
  const detailMatch = normalizedPath.match(/^\/recipes\/([^/]+)$/);

  if (isCreatePath) {
    return <RecipeFormPage mode="create" onNavigate={onNavigate} />;
  }

  if (editMatch?.[1]) {
    return <RecipeEditPage recipeId={editMatch[1]} onNavigate={onNavigate} />;
  }

  if (detailMatch?.[1]) {
    return <RecipeDetailPage recipeId={detailMatch[1]} onNavigate={onNavigate} />;
  }

  return <RecipeListPage onNavigate={onNavigate} />;
}

function RecipeListPage({ onNavigate }: { onNavigate: (path: string) => void }) {
  const [recipes, setRecipes] = useState<AdminRecipe[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadRecipes() {
      setIsLoading(true);
      setError(null);
      try {
        const data = await getAdminRecipes();
        if (isMounted) {
          setRecipes(data.recipes);
        }
      } catch (loadError) {
        if (isMounted) {
          setError(loadError instanceof Error ? loadError.message : "Unable to load recipes");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadRecipes();
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="page-stack">
      <div className="resource-toolbar">
        <div><p className="eyebrow">Admin Recipe Management</p><h2>Recipe directory</h2></div>
        <button type="button" onClick={() => onNavigate("/recipes/new")}>Create Recipe</button>
      </div>
      {isLoading ? <LoadingState title="Loading recipes" message="Fetching preparation rules and ingredient associations..." /> : null}
      {error ? <ErrorState title="Recipes unavailable" message={error} /> : null}
      {!isLoading && !error && recipes.length === 0 ? <EmptyState title="No recipes found" message="Create a recipe to define the inventory ingredients used by a product." /> : null}
      {!isLoading && !error && recipes.length > 0 ? <RecipeTable recipes={recipes} onNavigate={onNavigate} /> : null}
    </div>
  );
}

function RecipeTable({ recipes, onNavigate }: { recipes: AdminRecipe[]; onNavigate: (path: string) => void }) {
  return (
    <section className="table-panel" aria-label="Recipes">
      <table className="data-table">
        <thead><tr><th scope="col">Recipe</th><th scope="col">Version</th><th scope="col">Yield</th><th scope="col">Ingredients</th><th scope="col">Ingredient cost</th><th scope="col">Status</th><th scope="col">Details</th></tr></thead>
        <tbody>
          {recipes.map((recipe) => (
            <tr key={recipe._id}>
              <td><strong>{recipe.name}</strong><span>{recipe.code}</span></td>
              <td>v{recipe.version}</td>
              <td>{recipe.yieldQuantity} {formatUnit(recipe.yieldUnit)}</td>
              <td>{recipe.ingredients.length}</td>
              <td>{formatRecipeCost(recipe.totalIngredientCostCents)}</td>
              <td><StatusBadge value={recipe.status} /></td>
              <td><a href={`/recipes/${recipe._id}`} onClick={(event) => { event.preventDefault(); onNavigate(`/recipes/${recipe._id}`); }}>View details</a></td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

function RecipeEditPage({ recipeId, onNavigate }: { recipeId: string; onNavigate: (path: string) => void }) {
  const [recipe, setRecipe] = useState<AdminRecipe | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function loadRecipe() {
      setIsLoading(true);
      setError(null);
      try {
        const data = await getAdminRecipe(recipeId);
        if (isMounted) {
          setRecipe(data.recipe);
        }
      } catch (loadError) {
        if (isMounted) {
          setError(loadError instanceof Error ? loadError.message : "Unable to load recipe");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadRecipe();
    return () => {
      isMounted = false;
    };
  }, [recipeId]);

  return (
    <div className="page-stack">
      {isLoading ? <LoadingState title="Loading recipe" message="Preparing this recipe for editing..." /> : null}
      {error ? <ErrorState title="Recipe unavailable" message={error} /> : null}
      {!isLoading && !error && recipe ? <RecipeFormPage mode="edit" recipe={recipe} onNavigate={onNavigate} /> : null}
    </div>
  );
}

function RecipeFormPage({ mode, recipe, onNavigate }: { mode: "create" | "edit"; recipe?: AdminRecipe; onNavigate: (path: string) => void }) {
  const [form, setForm] = useState<RecipeFormValues>(() => recipeToForm(recipe));
  const [inventory, setInventory] = useState<AdminInventoryItem[]>([]);
  const [inventoryError, setInventoryError] = useState<string | null>(null);
  const [isLoadingInventory, setIsLoadingInventory] = useState(true);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let isMounted = true;
    async function loadInventory() {
      setIsLoadingInventory(true);
      setInventoryError(null);
      try {
        const data = await getAdminInventory();
        if (isMounted) {
          setInventory(data.inventory);
        }
      } catch (loadError) {
        if (isMounted) {
          setInventoryError(loadError instanceof Error ? loadError.message : "Unable to load inventory items");
        }
      } finally {
        if (isMounted) {
          setIsLoadingInventory(false);
        }
      }
    }

    void loadInventory();
    return () => {
      isMounted = false;
    };
  }, []);

  function updateField(event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    clearFieldError(name);
  }

  function updateIngredient(index: number, field: keyof IngredientFormValues, value: string) {
    setForm((current) => ({
      ...current,
      ingredients: current.ingredients.map((ingredient, ingredientIndex) => ingredientIndex === index ? { ...ingredient, [field]: value } : ingredient),
    }));
    setSubmitError(null);
    setFieldErrors((current) => {
      const next = { ...current };
      delete next.ingredients;
      return next;
    });
  }

  function clearFieldError(name: string) {
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

  function addIngredient() {
    setForm((current) => ({ ...current, ingredients: [...current.ingredients, emptyIngredient()] }));
  }

  function removeIngredient(index: number) {
    setForm((current) => ({ ...current, ingredients: current.ingredients.length === 1 ? current.ingredients : current.ingredients.filter((_ingredient, ingredientIndex) => ingredientIndex !== index) }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitError(null);
    const errors = validateRecipeForm(form);
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      return;
    }

    const input: CreateAdminRecipeInput = {
      name: form.name.trim(),
      code: form.code.trim().toUpperCase(),
      status: form.status as CreateAdminRecipeInput["status"],
      version: Number(form.version),
      yieldQuantity: Number(form.yieldQuantity),
      yieldUnit: form.yieldUnit as CreateAdminRecipeInput["yieldUnit"],
      ingredients: form.ingredients.map((ingredient) => ({
        inventoryItemId: ingredient.inventoryItemId,
        quantity: Number(ingredient.quantity),
        unit: ingredient.unit as CreateAdminRecipeInput["ingredients"][number]["unit"],
        preparationNote: ingredient.preparationNote.trim() || undefined,
      })),
    };

    setIsSubmitting(true);
    try {
      const data = mode === "create" ? await createAdminRecipe(input) : await updateAdminRecipe(recipe!._id, input);
      sessionStorage.setItem(mode === "create" ? recipeCreatedMessageKey : recipeUpdatedMessageKey, `${data.recipe.name} was ${mode === "create" ? "created" : "updated"} successfully.`);
      onNavigate(`/recipes/${data.recipe._id}`);
    } catch (saveError) {
      setSubmitError(saveError instanceof Error ? saveError.message : mode === "create" ? "Unable to create recipe" : "Unable to update recipe");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="page-stack">
      <div className="resource-toolbar"><div><p className="eyebrow">Admin Recipe Management</p><h2>{mode === "create" ? "Create recipe" : `Edit ${recipe?.name ?? "recipe"}`}</h2></div><button type="button" className="secondary-button" onClick={() => onNavigate("/recipes")}>Back to Recipes</button></div>
      {isLoadingInventory ? <LoadingState title="Loading inventory" message="Preparing inventory choices for recipe ingredients..." /> : null}
      {inventoryError ? <ErrorState title="Inventory unavailable" message={inventoryError} /> : null}
      {submitError ? <ErrorState title="Recipe not saved" message={submitError} /> : null}
      {!isLoadingInventory && !inventoryError ? (
        <form className="store-form" onSubmit={handleSubmit} noValidate>
          <section aria-label="Recipe details"><h3>Recipe details</h3><div className="form-grid">
            <RecipeField label="Recipe name" name="name" value={form.name} onChange={updateField} error={fieldErrors.name} required />
            <RecipeField label="Recipe code" name="code" value={form.code} onChange={updateField} error={fieldErrors.code} required />
            <label className="form-field"><span>Status *</span><select name="status" value={form.status} onChange={updateField}>{recipeStatusOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
            <RecipeField label="Version" name="version" type="number" min="1" step="1" value={form.version} onChange={updateField} error={fieldErrors.version} required />
            <RecipeField label="Yield quantity" name="yieldQuantity" type="number" min="0.000001" step="0.000001" value={form.yieldQuantity} onChange={updateField} error={fieldErrors.yieldQuantity} required />
            <label className="form-field"><span>Yield unit *</span><select name="yieldUnit" value={form.yieldUnit} onChange={updateField}>{inventoryUnitOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
          </div></section>
          <section aria-label="Recipe ingredients"><h3>Ingredients</h3><p className="form-hint">Select each inventory item and enter the quantity used for one recipe yield. Ingredient costing will consume these relationships in the later costing task.</p>
            {form.ingredients.map((ingredient, index) => <div className="form-grid packaging-level-row" key={index}>
              <label className="form-field"><span>Inventory item {index + 1} *</span><select value={ingredient.inventoryItemId} onChange={(event) => updateIngredient(index, "inventoryItemId", event.target.value)}><option value="">Select inventory item</option>{inventory.map((item) => <option key={item._id} value={item._id}>{item.name} ({item.sku})</option>)}</select></label>
              <RecipeField label="Quantity" name={`ingredient-quantity-${index}`} type="number" min="0.000001" step="0.000001" value={ingredient.quantity} onChange={(event) => updateIngredient(index, "quantity", event.target.value)} required />
              <label className="form-field"><span>Unit *</span><select value={ingredient.unit} onChange={(event) => updateIngredient(index, "unit", event.target.value)}>{inventoryUnitOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
              <RecipeField label="Preparation note" name={`ingredient-note-${index}`} value={ingredient.preparationNote} onChange={(event) => updateIngredient(index, "preparationNote", event.target.value)} />
              {form.ingredients.length > 1 ? <button type="button" className="secondary-button" onClick={() => removeIngredient(index)}>Remove ingredient</button> : null}
            </div>)}
            <button type="button" className="secondary-button" onClick={addIngredient}>Add ingredient</button>
            {fieldErrors.ingredients ? <p className="form-hint" role="alert">{fieldErrors.ingredients}</p> : null}
          </section>
          {Object.keys(fieldErrors).length > 0 ? <p className="form-hint" role="alert">Please correct the highlighted recipe fields before submitting.</p> : null}
          <div className="form-actions"><button type="button" className="secondary-button" onClick={() => onNavigate("/recipes")}>Cancel</button><button type="submit" disabled={isSubmitting}>{isSubmitting ? "Saving..." : mode === "create" ? "Create Recipe" : "Save Recipe"}</button></div>
        </form>
      ) : null}
    </div>
  );
}

function RecipeDetailPage({ recipeId, onNavigate }: { recipeId: string; onNavigate: (path: string) => void }) {
  const [recipe, setRecipe] = useState<AdminRecipe | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const createdMessage = sessionStorage.getItem(recipeCreatedMessageKey);
    const updatedMessage = sessionStorage.getItem(recipeUpdatedMessageKey);
    const messageKey = createdMessage ? recipeCreatedMessageKey : recipeUpdatedMessageKey;
    setSuccessMessage(createdMessage ?? updatedMessage);
    if (createdMessage || updatedMessage) {
      sessionStorage.removeItem(messageKey);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    async function loadRecipe() {
      setIsLoading(true);
      setError(null);
      try {
        const data = await getAdminRecipe(recipeId);
        if (isMounted) {
          setRecipe(data.recipe);
        }
      } catch (loadError) {
        if (isMounted) {
          setError(loadError instanceof Error ? loadError.message : "Unable to load recipe");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadRecipe();
    return () => {
      isMounted = false;
    };
  }, [recipeId]);

  return (
    <div className="page-stack">
      <div className="resource-toolbar"><div><p className="eyebrow">Admin Recipe Management</p><h2>Recipe details</h2></div><div className="form-actions"><button type="button" className="secondary-button" onClick={() => onNavigate("/recipes")}>Back to Recipes</button>{recipe ? <button type="button" onClick={() => onNavigate(`/recipes/${recipe._id}/edit`)}>Edit Recipe</button> : null}</div></div>
      {isLoading ? <LoadingState title="Loading recipe" message="Fetching recipe details and ingredients..." /> : null}
      {error ? <ErrorState title="Recipe unavailable" message={error} /> : null}
      {successMessage ? <section className="state-panel" role="status"><div><h2>Recipe saved</h2><p>{successMessage}</p></div></section> : null}
      {!isLoading && !error && recipe ? <RecipeDetailPanel recipe={recipe} /> : null}
    </div>
  );
}

function RecipeDetailPanel({ recipe }: { recipe: AdminRecipe }) {
  return (
    <>
      <section className="detail-panel" aria-label="Recipe summary">
        <div><span>Recipe name</span><strong>{recipe.name}</strong></div><div><span>Code</span><strong>{recipe.code}</strong></div><div><span>Status</span><strong>{formatRecipeStatus(recipe.status)}</strong></div><div><span>Version</span><strong>v{recipe.version}</strong></div><div><span>Yield</span><strong>{recipe.yieldQuantity} {formatUnit(recipe.yieldUnit)}</strong></div><div><span>Ingredients</span><strong>{recipe.ingredients.length}</strong></div><div><span>Total ingredient cost</span><strong>{formatRecipeCost(recipe.totalIngredientCostCents)}</strong></div><div><span>Cost per yield</span><strong>{formatRecipeCost(recipe.costPerYieldCents)}</strong></div>
      </section>
      <section className="related-panel" aria-label="Recipe ingredients"><h3>Ingredients</h3><div className="related-list">{recipe.ingredients.map((ingredient) => <article className="related-row" key={ingredient.inventoryItemId}><div><strong>{ingredient.item?.name ?? "Inventory item unavailable"}</strong><span>{ingredient.item?.sku ?? ingredient.inventoryItemId} · {ingredient.quantity} {formatUnit(ingredient.unit)}</span></div>{ingredient.preparationNote ? <div><span>{ingredient.preparationNote}</span></div> : null}</article>)}</div></section>
      <RecipeCostPanel recipe={recipe} />
    </>
  );
}

function RecipeCostPanel({ recipe }: { recipe: AdminRecipe }) {
  return (
    <section className="related-panel" aria-label="Recipe ingredient costing">
      <h3>Ingredient costing</h3>
      <div className="related-list">
        {recipe.ingredients.map((ingredient) => (
          <article className="related-row" key={`cost-${ingredient.inventoryItemId}`}>
            <div>
              <strong>{ingredient.item?.name ?? "Inventory item unavailable"}</strong>
              <span>Unit cost: {formatRecipeCost(ingredient.unitCostCents)}</span>
              <span>Ingredient cost: {formatRecipeCost(ingredient.ingredientCostCents)}</span>
            </div>
            {ingredient.costStatus !== "calculated" ? <div><span>{formatIngredientCostStatus(ingredient.costStatus)}</span></div> : null}
          </article>
        ))}
      </div>
    </section>
  );
}

function RecipeField({ label, name, value, onChange, error, required, type = "text", min, step }: { label: string; name: string; value: string; onChange: (event: ChangeEvent<HTMLInputElement>) => void; error?: string; required?: boolean; type?: string; min?: string; step?: string }) {
  return <label className="form-field"><span>{label}{required ? " *" : ""}</span><input name={name} type={type} min={min} step={step} value={value} onChange={onChange} required={required} />{error ? <small role="alert">{error}</small> : null}</label>;
}

function recipeToForm(recipe?: AdminRecipe): RecipeFormValues {
  return {
    name: recipe?.name ?? "",
    code: recipe?.code ?? "",
    status: recipe?.status ?? "draft",
    version: String(recipe?.version ?? 1),
    yieldQuantity: recipe ? String(recipe.yieldQuantity) : "1",
    yieldUnit: recipe?.yieldUnit ?? "each",
    ingredients: recipe?.ingredients.map((ingredient) => ({ inventoryItemId: ingredient.inventoryItemId, quantity: String(ingredient.quantity), unit: ingredient.unit, preparationNote: ingredient.preparationNote ?? "" })) ?? [emptyIngredient()],
  };
}

function emptyIngredient(): IngredientFormValues {
  return { inventoryItemId: "", quantity: "", unit: "each", preparationNote: "" };
}

function validateRecipeForm(form: RecipeFormValues) {
  const errors: Record<string, string> = {};
  if (form.name.trim().length < 2 || form.name.trim().length > 160) errors.name = "Name must be between 2 and 160 characters.";
  if (!/^[A-Za-z0-9_.-]{2,64}$/.test(form.code.trim())) errors.code = "Use 2–64 letters, numbers, underscores, periods, or hyphens.";
  if (!recipeStatusOptions.some((option) => option.value === form.status)) errors.status = "Select a supported recipe status.";
  const version = Number(form.version);
  if (!Number.isInteger(version) || version < 1) errors.version = "Version must be a positive whole number.";
  const yieldQuantity = Number(form.yieldQuantity);
  if (!Number.isFinite(yieldQuantity) || yieldQuantity <= 0) errors.yieldQuantity = "Yield quantity must be greater than 0.";
  if (!inventoryUnitOptions.some((option) => option.value === form.yieldUnit)) errors.yieldUnit = "Select a supported yield unit.";
  if (form.ingredients.length === 0) errors.ingredients = "Add at least one ingredient.";
  if (form.ingredients.some((ingredient) => !ingredient.inventoryItemId || !Number.isFinite(Number(ingredient.quantity)) || Number(ingredient.quantity) <= 0 || !inventoryUnitOptions.some((option) => option.value === ingredient.unit))) errors.ingredients = "Every ingredient needs an inventory item, a quantity greater than 0, and a supported unit.";
  if (new Set(form.ingredients.map((ingredient) => ingredient.inventoryItemId).filter(Boolean)).size !== form.ingredients.filter((ingredient) => ingredient.inventoryItemId).length) errors.ingredients = "Each inventory item may only appear once in a recipe.";
  return errors;
}

function formatRecipeStatus(value: string) {
  return recipeStatusOptions.find((option) => option.value === value)?.label ?? formatValue(value);
}

function formatRecipeCost(cents: number | null) {
  return cents === null ? "Unavailable" : `$${(cents / 100).toFixed(2)}`;
}

function formatIngredientCostStatus(value: string) {
  if (value === "missing_inventory") return "Inventory item unavailable; cost cannot be calculated.";
  if (value === "missing_unit_cost") return "Inventory unit cost is not available.";
  if (value === "unit_not_available") return "The recipe unit is not connected to the inventory packaging chain.";
  return "Cost calculated.";
}

function formatUnit(value: string) {
  return inventoryUnitOptions.find((option) => option.value === value)?.label.toLowerCase() ?? formatValue(value);
}

function formatValue(value: string) {
  return value.split("_").map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(" ");
}

function StatusBadge({ value }: { value: string }) {
  return <span className={`status-badge status-badge-${value}`}>{formatValue(value)}</span>;
}
