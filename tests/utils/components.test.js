import { describe, test, expect } from 'bun:test';
import V2Builder from '../../src/utils/components';

describe('V2Builder - Discord Components V2', () => {
    test('should create container', () => {
        const container = V2Builder.container([
            V2Builder.textDisplay('Test text')
        ]);

        expect(container).toBeDefined();
        expect(container.type).toBe(1);
        expect(container.components).toHaveLength(1);
    });

    test('should create text display', () => {
        const text = V2Builder.textDisplay('Hello World');
        
        expect(text).toBeDefined();
        expect(text.type).toBe(1);
        expect(text.text).toHaveProperty('content');
    });

    test('should create button', () => {
        const button = V2Builder.button('Click me', 'test_button', 1);
        
        expect(button).toBeDefined();
        expect(button.type).toBe(2);
        expect(button.custom_id).toBe('test_button');
        expect(button.style).toBe(1);
    });

    test('should create action row', () => {
        const actionRow = V2Builder.actionRow([
            V2Builder.button('Button 1', 'btn1', 1),
            V2Builder.button('Button 2', 'btn2', 2)
        ]);

        expect(actionRow).toBeDefined();
        expect(actionRow.type).toBe(1);
        expect(actionRow.components).toHaveLength(2);
    });

    test('should create media gallery', () => {
        const gallery = V2Builder.mediaGallery([
            { media: { url: 'https://example.com/image1.jpg' } },
            { media: { url: 'https://example.com/image2.jpg' } }
        ]);

        expect(gallery).toBeDefined();
        expect(gallery.type).toBe(1);
        expect(gallery.media_gallery).toHaveProperty('items');
        expect(gallery.media_gallery.items).toHaveLength(2);
    });

    test('should create section', () => {
        const section = V2Builder.section([
            V2Builder.textDisplay('Section title')
        ]);

        expect(section).toBeDefined();
        expect(section.type).toBe(1);
        expect(section.components).toHaveLength(1);
    });

    test('should create thumbnail', () => {
        const thumbnail = V2Builder.thumbnail('https://example.com/thumb.jpg');
        
        expect(thumbnail).toBeDefined();
        expect(thumbnail.type).toBe(1);
        expect(thumbnail.thumbnail).toHaveProperty('media');
        expect(thumbnail.thumbnail.media.url).toBe('https://example.com/thumb.jpg');
    });
});
