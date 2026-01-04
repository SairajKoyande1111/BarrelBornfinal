import { MongoClient, Db, Collection, ObjectId } from "mongodb";
import { type User, type InsertUser, type MenuItem, type InsertMenuItem, type CartItem, type InsertCartItem } from "@shared/schema";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  getMenuItems(): Promise<MenuItem[]>;
  getMenuItemsByCategory(category: string): Promise<MenuItem[]>;
  getMenuItem(id: string): Promise<MenuItem | undefined>;
  getCategories(): string[];
  addMenuItem(item: InsertMenuItem): Promise<MenuItem>;

  getCartItems(): Promise<CartItem[]>;
  addToCart(item: InsertCartItem): Promise<CartItem>;
  removeFromCart(id: string): Promise<void>;
  clearCart(): Promise<void>;
  
  clearDatabase(): Promise<void>;
  fixVegNonVegClassification(): Promise<{ updated: number; details: string[] }>;
}

export class MongoStorage implements IStorage {
  private client: MongoClient;
  private db: Db;
  private categoryCollections: Map<string, Collection<MenuItem>>;
  private cartItemsCollection: Collection<CartItem>;
  private usersCollection: Collection<User>;
  private restaurantId: ObjectId;

  private readonly categories = [
    "nibbles",
    "soups",
    "titbits",
    "salads",
    "mangalorean-style",
    "wok",
    "charcoal",
    "continental",
    "pasta",
    "artisan-pizzas",
    "mini-burger-sliders",
    "entree-(main-course)",
    "bao-&-dim-sum",
    "indian-mains---curries",
    "biryanis-&-rice",
    "dals",
    "breads",
    "asian-mains",
    "rice-with-curry---thai-&-asian-bowls",
    "rice-&-noodles",
    "desserts",
    "blended-whisky",
    "blended-scotch-whisky",
    "american-irish-whiskey",
    "single-malt-whisky",
    "vodka",
    "gin",
    "rum",
    "tequila",
    "cognac-brandy",
    "liqueurs",
    "sparkling-wine",
    "white-wines",
    "rose-wines",
    "red-wines",
    "dessert-wines",
    "port-wine",
    "signature-mocktails",
    "soft-beverages",
    "craft-beers-on-tap",
    "draught-beer",
    "pint-beers",
    "classic-cocktails",
    "signature-cocktails",
    "wine-cocktails",
    "sangria",
    "signature-shots",
    "indian-mains---curries",
    "biryanis-rice",
    "bao-dimsum",
    "entree",
    "rice-with-curry---thai-asian-bowls",
    "thai-bowls",
    "starters",
    "tandoor-starters",
    "oriental-starters",
    "sizzlers",
    "sliders",
    "pizza"
  ];

  constructor(connectionString: string) {
    this.client = new MongoClient(connectionString);
    this.db = this.client.db("barrelborn");
    this.categoryCollections = new Map();

    const categoryCollectionMapping: Record<string, string> = {
      'nibbles': 'nibbles',
      'soups': 'soups',
      'titbits': 'titbits',
      'salads': 'salads',
      'mangalorean-style': 'mangalorean-style',
      'wok': 'wok',
      'charcoal': 'charcoal',
      'continental': 'continental',
      'pasta': 'pasta',
      'artisan-pizzas': 'artisan-pizzas',
      'mini-burger-sliders': 'mini-burger-sliders',
      'entree-(main-course)': 'entree-(main-course)',
      'bao-&-dim-sum': 'bao-&-dim-sum',
      'indian-mains---curries': 'indian-mains---curries',
      'biryanis-&-rice': 'biryanis-&-rice',
      'dals': 'dals',
      'breads': 'breads',
      'asian-mains': 'asian-mains',
      'rice-with-curry---thai-&-asian-bowls': 'rice-with-curry---thai-&-asian-bowls',
      'rice-&-noodles': 'rice-&-noodles',
      'desserts': 'desserts',
      'blended-whisky': 'blended-whisky',
      'blended-scotch-whisky': 'blended-scotch-whisky',
      'american-irish-whiskey': 'american-irish-whiskey',
      'single-malt-whisky': 'single-malt-whisky',
      'vodka': 'vodka',
      'gin': 'gin',
      'rum': 'rum',
      'tequila': 'tequila',
      'cognac-brandy': 'cognac-brandy',
      'liqueurs': 'liqueurs',
      'sparkling-wine': 'sparkling-wine',
      'white-wines': 'white-wines',
      'rose-wines': 'rose-wines',
      'red-wines': 'red-wines',
      'dessert-wines': 'dessert-wines',
      'port-wine': 'port-wine',
      'signature-mocktails': 'signature-mocktails',
      'soft-beverages': 'soft-beverages',
      'craft-beers-on-tap': 'craft-beers-on-tap',
      'draught-beer': 'draught-beer',
      'pint-beers': 'pint-beers',
      'classic-cocktails': 'classic-cocktails',
      'signature-cocktails': 'signature-cocktails',
      'wine-cocktails': 'wine-cocktails',
      'sangria': 'sangria',
      'signature-shots': 'signature-shots',
      'biryanis-rice': 'biryanis-rice',
      'bao-dimsum': 'bao-dimsum',
      'entree': 'entree',
      'rice-with-curry---thai-asian-bowls': 'rice-with-curry---thai-asian-bowls',
      'thai-bowls': 'thai-bowls',
      'starters': 'starters',
      'tandoor-starters': 'tandoor-starters',
      'oriental-starters': 'oriental-starters',
      'sizzlers': 'sizzlers',
      'sliders': 'sliders',
      'pizza': 'pizza'
    };

    this.categories.forEach(category => {
      const collectionName = categoryCollectionMapping[category];
      if (collectionName) {
        this.categoryCollections.set(category, this.db.collection(collectionName));
      }
    });

    this.cartItemsCollection = this.db.collection("cartitems");
    this.usersCollection = this.db.collection("users");
    this.restaurantId = new ObjectId("6874cff2a880250859286de6");
  }

  async connect() {
    await this.client.connect();
  }

  async getUser(id: string): Promise<User | undefined> {
    const user = await this.usersCollection.findOne({ _id: new ObjectId(id) });
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const user = await this.usersCollection.findOne({ username });
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const now = new Date();
    const user = { ...insertUser, createdAt: now, updatedAt: now };
    const result = await this.usersCollection.insertOne(user as any);
    return { _id: result.insertedId, ...user } as any;
  }

  async getMenuItems(): Promise<MenuItem[]> {
    const allMenuItems: MenuItem[] = [];
    const collections = Array.from(this.categoryCollections.values());
    for (const collection of collections) {
      const items = await collection.find({}).toArray();
      allMenuItems.push(...items);
    }
    return this.sortMenuItems(allMenuItems);
  }

  async getMenuItemsByCategory(category: string): Promise<MenuItem[]> {
    console.log(`[Storage] Fetching items for category: ${category}`);
    const collection = this.categoryCollections.get(category);
    if (!collection) {
      console.log(`[Storage] No collection found for category: ${category}`);
      return [];
    }
    const menuItems = await collection.find({}).toArray();
    console.log(`[Storage] Found ${menuItems.length} items for ${category}`);
    return this.sortMenuItems(menuItems);
  }

  async getMenuItem(id: string): Promise<MenuItem | undefined> {
    const collections = Array.from(this.categoryCollections.values());
    for (const collection of collections) {
      const menuItem = await collection.findOne({ _id: new ObjectId(id) });
      if (menuItem) return menuItem;
    }
    return undefined;
  }

  getCategories(): string[] {
    return [...this.categories];
  }

  async addMenuItem(item: InsertMenuItem): Promise<MenuItem> {
    const collection = this.categoryCollections.get(item.category);
    if (!collection) throw new Error(`Category "${item.category}" not found`);
    const now = new Date();
    const menuItem = { ...item, restaurantId: this.restaurantId, createdAt: now, updatedAt: now, __v: 0 };
    const result = await collection.insertOne(menuItem as any);
    return { _id: result.insertedId, ...menuItem } as any;
  }

  async getCartItems(): Promise<CartItem[]> {
    return await this.cartItemsCollection.find({}).toArray();
  }

  async addToCart(item: InsertCartItem): Promise<CartItem> {
    const menuItemId = new ObjectId(item.menuItemId);
    const existing = await this.cartItemsCollection.findOne({ menuItemId });
    if (existing) {
      const updated = await this.cartItemsCollection.findOneAndUpdate(
        { _id: existing._id },
        { $inc: { quantity: item.quantity || 1 }, $set: { updatedAt: new Date() } },
        { returnDocument: 'after' }
      );
      return updated!;
    }
    const now = new Date();
    const cartItem = { menuItemId, quantity: item.quantity || 1, createdAt: now, updatedAt: now };
    const result = await this.cartItemsCollection.insertOne(cartItem as any);
    return { _id: result.insertedId, ...cartItem } as any;
  }

  async removeFromCart(id: string): Promise<void> {
    await this.cartItemsCollection.deleteOne({ _id: new ObjectId(id) });
  }

  async clearCart(): Promise<void> {
    await this.cartItemsCollection.deleteMany({});
  }

  async clearDatabase(): Promise<void> {
    const collections = Array.from(this.categoryCollections.values());
    for (const collection of collections) {
      await collection.deleteMany({});
    }
  }

  async fixVegNonVegClassification(): Promise<{ updated: number; details: string[] }> {
    return { updated: 0, details: [] };
  }

  private sortMenuItems(items: MenuItem[]): MenuItem[] {
    return items.sort((a, b) => {
      if (a.isVeg !== b.isVeg) return a.isVeg ? -1 : 1;
      return a.name.localeCompare(b.name);
    });
  }
}

const connectionString = "mongodb+srv://airavatatechnologiesprojects:8tJ6v8oTyQE1AwLV@barrelborn.mmjpnwc.mongodb.net/?retryWrites=true&w=majority&appName=barrelborn";
export const storage = new MongoStorage(connectionString);
