import { splitText } from '../utils/texts';

describe('splitText', () => {

    it('should preserve line breaks', async () => {
        const input = 'Line 1\nLine 2\nLine 3';
        const output = await splitText(input);

        // Vérifiez que chaque ligne du texte d'entrée est présente dans le texte de sortie
        for (const line of input.split('\n')) {
            expect(output.join('')).toContain(line);
        }

        // Vérifiez que le nombre de retours à la ligne dans le texte de sortie est le même que dans le texte d'entrée
        expect((output.join('').match(/\n/g) || []).length).toBe((input.match(/\n/g) || []).length);
    });
});