import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';

async function parseMenu() {
    try {
        const filePath = path.join(process.cwd(), 'attached_assets/barrelborn_menu_complete_corrected_1767508816272.xlsx');
        const fileBuffer = fs.readFileSync(filePath);
        const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(worksheet);
        
        console.log(JSON.stringify(data, null, 2));
    } catch (error) {
        console.error('Error parsing Excel:', error);
    }
}

parseMenu();
