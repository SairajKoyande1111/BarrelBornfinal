import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';
import { storage } from './storage';
import { type InsertMenuItem } from '../shared/schema';

async function uploadMenu() {
    try {
        console.log('Connecting to storage...');
        await storage.connect();

        const filePath = path.join(process.cwd(), 'attached_assets/barrelborn_menu_complete_corrected_1767508816272.xlsx');
        const fileBuffer = fs.readFileSync(filePath);
        const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const data: any[] = XLSX.utils.sheet_to_json(worksheet);
        
        console.log(`Clearing existing data...`);
        await storage.clearDatabase();

        console.log(`Processing ${data.length} items...`);
        
        const categoryMap: Record<string, string> = {
            "Entree (Main Course)": "entree",
            "Bao & Dim Sum": "bao-dimsum",
            "Indian Mains - Curries": "indian-mains---curries",
            "Biryanis & Rice": "biryanis-rice",
            "Rice with Curry - Thai & Asian Bowls": "rice-with-curry---thai-asian-bowls",
            "Rice & Noodles": "rice-&-noodles",
            "Nibbles": "nibbles",
            "Soups": "soups",
            "Titbits": "titbits",
            "Salads": "salads",
            "Mangalorean Style": "mangalorean-style",
            "Wok": "wok",
            "Charcoal": "charcoal",
            "Continental": "continental",
            "Pasta": "pasta",
            "Artisan Pizzas": "artisan-pizzas",
            "Mini Burger Sliders": "mini-burger-sliders",
            "Dals": "dals",
            "Breads": "breads",
            "Asian Mains": "asian-mains",
            "Thai Bowls": "thai-bowls",
            "Starters": "starters",
            "Tandoor Starters": "tandoor-starters",
            "Oriental Starters": "oriental-starters",
            "Sizzlers": "sizzlers",
            "Sliders": "sliders",
            "Pizza": "pizza"
        };

        for (const row of data) {
            const category = categoryMap[row.Category] || row.Category.toLowerCase().replace(/ /g, '-');
            
            const menuItem: InsertMenuItem = {
                name: row.Name,
                description: row.Description || "",
                price: row.Price.toString(),
                category: category,
                isVeg: row.IsVeg === true || row.IsVeg === "TRUE" || row.IsVeg === 1,
                image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c", // Placeholder
                isAvailable: true
            };

            try {
                await storage.addMenuItem(menuItem);
                console.log(`Added: ${menuItem.name} to ${menuItem.category}`);
            } catch (err) {
                console.error(`Failed to add ${menuItem.name}:`, err.message);
            }
        }

        console.log('Upload complete!');
        process.exit(0);
    } catch (error) {
        console.error('Error during upload:', error);
        process.exit(1);
    }
}

uploadMenu();
