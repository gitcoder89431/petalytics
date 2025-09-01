import type { PetPanelData } from '$lib/types/Pet';
import type { Guardian } from '$lib/types/Guardian';
import { petHelpers } from '$lib/stores/pets';
import { guardianHelpers } from '$lib/stores/guardian';
import { aiAnalysisHelpers } from '$lib/stores/ai-analysis';

export interface PetDataExport {
	version: string;
	exportDate: string;
	pet: PetPanelData;
	aiAnalyses: Record<string, any>;
}

export interface FullDataExport {
	version: string;
	exportDate: string;
	guardian: any;
	pets: PetPanelData[];
	aiAnalyses: Record<string, any>;
}

export class DataExporter {
	private static readonly CURRENT_VERSION = '1.0.0';

	// Export single pet as JSONL file
	static async exportPet(pet: PetPanelData): Promise<void> {
		try {
			const exportData: PetDataExport = {
				version: this.CURRENT_VERSION,
				exportDate: new Date().toISOString(),
				pet: pet,
				aiAnalyses: this.getAnalysesForPet(pet.id),
			};

			const jsonlContent = Object.keys(exportData)
				.map((key) => JSON.stringify({ [key]: exportData[key as keyof PetDataExport] }))
				.join('\n');

			this.downloadFile(jsonlContent, `${pet.name.toLowerCase().replace(/\s+/g, '_')}.jsonl`);
		} catch (error) {
			throw new Error('Failed to export pet data');
		}
	}

	// Export all data
	static async exportAllData(): Promise<void> {
		try {
			const pets = this.getAllPets();
			const guardian = this.getGuardian();

			const exportData: FullDataExport = {
				version: this.CURRENT_VERSION,
				exportDate: new Date().toISOString(),
				guardian: guardian,
				pets: pets,
				aiAnalyses: this.getAllAnalyses(),
			};

			const jsonlContent = Object.keys(exportData)
				.map((key) => JSON.stringify({ [key]: exportData[key as keyof FullDataExport] }))
				.join('\n');

			this.downloadFile(jsonlContent, `petalytics_backup_${this.formatDate(new Date())}.jsonl`);
		} catch (error) {
			throw new Error('Failed to export all data');
		}
	}

	// Import JSONL file
	static async importFromFile(file: File): Promise<{ success: boolean; message: string }> {
		try {
			if (!file.name.endsWith('.jsonl')) {
				return { success: false, message: 'Please select a valid JSONL file' };
			}

			const content = await this.readFileAsText(file);
			const importData = this.parseJSONL(content);

			const validation = this.validateImportData(importData);
			if (!validation.valid) {
				return { success: false, message: validation.error || 'Invalid data format' };
			}

			if (importData.pets) {
				return await this.importFullBackup(importData);
			} else if (importData.pet) {
				return await this.importSinglePet(importData);
			}

			return { success: false, message: 'Invalid data format' };
		} catch (error) {
			return { success: false, message: 'Failed to import data: ' + (error as Error).message };
		}
	}

	private static parseJSONL(content: string): any {
		const lines = content.trim().split('\n');
		let result: any = {};

		for (const line of lines) {
			if (line.trim()) {
				const parsed = JSON.parse(line);
				result = { ...result, ...parsed };
			}
		}

		return result;
	}

	private static downloadFile(content: string, filename: string): void {
		const blob = new Blob([content], { type: 'application/jsonl' });
		const url = URL.createObjectURL(blob);

		const link = document.createElement('a');
		link.href = url;
		link.download = filename;
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);

		URL.revokeObjectURL(url);
	}

	private static readFileAsText(file: File): Promise<string> {
		return new Promise((resolve, reject) => {
			const reader = new FileReader();
			reader.onload = () => resolve(reader.result as string);
			reader.onerror = () => reject(reader.error);
			reader.readAsText(file);
		});
	}

	private static formatDate(date: Date): string {
		return date.toISOString().split('T')[0];
	}

	private static getAllPets(): PetPanelData[] {
		return petHelpers.getAllPets();
	}

	private static getGuardian(): any {
		return guardianHelpers.load();
	}

	private static getAnalysesForPet(petId: string): Record<string, any> {
		// Get AI analyses for specific pet from journal entries
		const analyses: Record<string, any> = {};
		const pet = petHelpers.getPet(petId);
		if (pet?.journalEntries) {
			pet.journalEntries.forEach((entry) => {
				const analysis = aiAnalysisHelpers.getAnalysis(entry.id);
				if (analysis) {
					analyses[entry.id] = analysis;
				}
			});
		}
		return analyses;
	}

	private static getAllAnalyses(): Record<string, any> {
		// Get all AI analyses from all pets
		const allAnalyses: Record<string, any> = {};
		const pets = this.getAllPets();
		pets.forEach((pet) => {
			const petAnalyses = this.getAnalysesForPet(pet.id);
			Object.assign(allAnalyses, petAnalyses);
		});
		return allAnalyses;
	}

	private static validateImportData(data: any): { valid: boolean; error?: string } {
		if (!data.version || !data.exportDate) {
			return { valid: false, error: 'Invalid file format - missing version or export date' };
		}

		// Check version compatibility
		const [majorVersion] = data.version.split('.');
		const [currentMajor] = this.CURRENT_VERSION.split('.');
		if (majorVersion !== currentMajor) {
			return { valid: false, error: 'Incompatible file version' };
		}

		// Validate structure
		if (data.pets && !Array.isArray(data.pets)) {
			return { valid: false, error: 'Invalid pets data format' };
		}

		if (data.pet && (!data.pet.id || !data.pet.name)) {
			return { valid: false, error: 'Invalid pet data format' };
		}

		return { valid: true };
	}

	private static async importFullBackup(
		data: FullDataExport
	): Promise<{ success: boolean; message: string }> {
		let count = 0;

		if (data.guardian) {
			guardianHelpers.importGuardian(data.guardian);
		}

		if (data.pets?.length) {
			for (const pet of data.pets) {
				petHelpers.importPet(pet);
				count++;
			}
		}

		return { success: true, message: `Imported ${count} pets successfully` };
	}

	private static async importSinglePet(
		data: PetDataExport
	): Promise<{ success: boolean; message: string }> {
		petHelpers.importPet(data.pet);
		return { success: true, message: `Imported ${data.pet.name} successfully` };
	}
}
