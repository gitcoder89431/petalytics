# Petalytics API Documentation

## AI Analysis Integration

Petalytics integrates directly with OpenRouter API for AI-powered pet insights.

### Authentication

Users provide their own OpenRouter API key through the Guardian Panel.

### Analysis Request Format

```typescript
interface AnalysisRequest {
	pet: {
		name: string;
		breed: string;
		age: number;
		gender: 'male' | 'female';
	};
	entry: {
		content: string;
		date: string;
		mood?: string;
		activityLevel?: string;
	};
	recentHistory: JournalEntry[];
}
```

### Analysis Response Format

```typescript
interface AnalysisResult {
	summary: string;
	moodTrend: 'improving' | 'stable' | 'concerning';
	activityLevel: 'low' | 'normal' | 'high';
	healthConcerns: string[];
	recommendations: string[];
	nextCheckupSuggestion?: string;
}
```

### Example Usage

```javascript
import { AIAnalyzer } from '$lib/utils/ai-analysis';

const analyzer = new AIAnalyzer(apiKey);
const result = await analyzer.analyzeJournalEntry(pet, entry);
```

## Data Export/Import

### Export Format (JSONL)

Each line contains a JSON object:

```jsonl
{"version": "1.0.0"}
{"exportDate": "2025-01-01T00:00:00.000Z"}
{"pet": {"id": "123", "name": "Buddy", ...}}
{"aiAnalyses": {"entry-1": {"summary": "...", ...}}}
```

### Import Validation

- File must have `.jsonl` extension
- Version compatibility checking
- Data structure validation
- Duplicate handling

## LocalStorage Schema

### Pet Data

```javascript
localStorage.setItem('petalytics-pets', JSON.stringify([
  {
    id: string,
    name: string,
    breed: string,
    age: number,
    profileImageUrl?: string,
    journalEntries: JournalEntry[]
  }
]));
```

### Guardian Data

```javascript
localStorage.setItem(
	'petalytics-guardian',
	JSON.stringify({
		name: string,
		apiKey: string,
		preferences: object,
		apiKeyValid: boolean,
	})
);
```
