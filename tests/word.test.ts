import fs from 'fs';
import { newWord } from '../utils/word';

describe('newWord function', () => {
    const outputPath = __dirname + '/test-output.docx';

    afterAll(() => {
        // Nettoyer: supprimer le fichier de test après l'exécution du test
        if (fs.existsSync(outputPath)) {
            fs.unlinkSync(outputPath);
        }
    });

    it('should create a Word document', async () => {
        const text1 = ["Texte en français", "Deuxième ligne"];
        const text2 = ["Translated text", "Second line"];

        await newWord(text1, text2, outputPath);

        // Vérifier si le fichier a été créé
        expect(fs.existsSync(outputPath)).toBe(true);

        // Ici, vous pouvez ajouter des vérifications supplémentaires pour le contenu si nécessaire
    });
});