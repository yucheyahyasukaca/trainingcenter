-- Add hierarchical learning content
-- Main materials with sub-materials

-- Clear existing content for this class
DELETE FROM learning_contents WHERE class_id = '8098f213-7d7d-4772-8e47-f264c8d91512';

-- Add main materials
INSERT INTO learning_contents (
    class_id, 
    created_by, 
    title, 
    description, 
    content_type, 
    material_type, 
    level, 
    order_index, 
    is_free, 
    status, 
    is_required, 
    estimated_duration, 
    content_data, 
    is_expanded
) VALUES 
-- Main Material 1: Web Development
(
    '8098f213-7d7d-4772-8e47-f264c8d91512',
    (SELECT id FROM user_profiles LIMIT 1),
    'Pengenalan Web Development',
    'Materi dasar web development untuk pemula',
    'text',
    'main',
    0,
    0,
    true,
    'published',
    true,
    30,
    '{"body": "<h2>Selamat datang di Web Development!</h2><p>Dalam materi ini, Anda akan mempelajari dasar-dasar web development termasuk HTML, CSS, dan JavaScript.</p><h3>Yang akan dipelajari:</h3><ul><li>HTML untuk struktur halaman web</li><li>CSS untuk styling dan layout</li><li>JavaScript untuk interaktivitas</li><li>Best practices dalam web development</li></ul><p>Mari kita mulai perjalanan belajar web development bersama!</p>"}',
    true
),
-- Main Material 2: HTML
(
    '8098f213-7d7d-4772-8e47-f264c8d91512',
    (SELECT id FROM user_profiles LIMIT 1),
    'HTML Dasar',
    'Belajar struktur HTML dan elemen-elemen dasar',
    'text',
    'main',
    0,
    1,
    true,
    'published',
    true,
    45,
    '{"body": "<h2>HTML Dasar</h2><p>HTML (HyperText Markup Language) adalah bahasa markup yang digunakan untuk membuat struktur halaman web.</p><h3>Elemen HTML Dasar:</h3><pre><code>&lt;!DOCTYPE html&gt;<br/>&lt;html&gt;<br/>&nbsp;&nbsp;&lt;head&gt;<br/>&nbsp;&nbsp;&nbsp;&nbsp;&lt;title&gt;Judul Halaman&lt;/title&gt;<br/>&nbsp;&nbsp;&lt;/head&gt;<br/>&nbsp;&nbsp;&lt;body&gt;<br/>&nbsp;&nbsp;&nbsp;&nbsp;&lt;h1&gt;Heading 1&lt;/h1&gt;<br/>&nbsp;&nbsp;&nbsp;&nbsp;&lt;p&gt;Paragraf teks&lt;/p&gt;<br/>&nbsp;&nbsp;&lt;/body&gt;<br/>&lt;/html&gt;</code></pre><p>Setiap elemen HTML memiliki tag pembuka dan penutup.</p>"}',
    true
),
-- Main Material 3: CSS
(
    '8098f213-7d7d-4772-8e47-f264c8d91512',
    (SELECT id FROM user_profiles LIMIT 1),
    'CSS Styling',
    'Belajar CSS untuk styling dan layout',
    'text',
    'main',
    0,
    2,
    true,
    'published',
    true,
    40,
    '{"body": "<h2>CSS Styling</h2><p>CSS (Cascading Style Sheets) digunakan untuk mengatur tampilan dan layout halaman web.</p><h3>Contoh CSS:</h3><pre><code>body {<br/>&nbsp;&nbsp;font-family: Arial, sans-serif;<br/>&nbsp;&nbsp;background-color: #f0f0f0;<br/>}<br/><br/>h1 {<br/>&nbsp;&nbsp;color: #333;<br/>&nbsp;&nbsp;text-align: center;<br/>}</code></pre><p>CSS memungkinkan Anda mengubah warna, font, layout, dan banyak lagi!</p>"}',
    true
);

-- Get the IDs of the main materials for sub-materials
-- Add sub-materials for Web Development
INSERT INTO learning_contents (
    class_id, 
    created_by, 
    parent_id,
    title, 
    description, 
    content_type, 
    material_type, 
    level, 
    order_index, 
    is_free, 
    status, 
    is_required, 
    estimated_duration, 
    content_data, 
    is_expanded
) VALUES 
-- Sub-material 1.1: Tools yang Dibutuhkan
(
    '8098f213-7d7d-4772-8e47-f264c8d91512',
    (SELECT id FROM user_profiles LIMIT 1),
    (SELECT id FROM learning_contents WHERE class_id = '8098f213-7d7d-4772-8e47-f264c8d91512' AND title = 'Pengenalan Web Development' LIMIT 1),
    'Tools yang Dibutuhkan',
    'Daftar tools dan software untuk web development',
    'text',
    'sub',
    1,
    0,
    true,
    'published',
    true,
    15,
    '{"body": "<h3>Tools yang Dibutuhkan</h3><p>Untuk memulai web development, Anda memerlukan beberapa tools:</p><ul><li><strong>Text Editor:</strong> VS Code, Sublime Text, atau Atom</li><li><strong>Browser:</strong> Chrome, Firefox, atau Safari</li><li><strong>Git:</strong> Untuk version control</li><li><strong>Node.js:</strong> Untuk JavaScript runtime</li></ul><p>Mari kita install dan setup tools ini!</p>"}',
    true
),
-- Sub-material 1.2: Konsep Dasar
(
    '8098f213-7d7d-4772-8e47-f264c8d91512',
    (SELECT id FROM user_profiles LIMIT 1),
    (SELECT id FROM learning_contents WHERE class_id = '8098f213-7d7d-4772-8e47-f264c8d91512' AND title = 'Pengenalan Web Development' LIMIT 1),
    'Konsep Dasar Web',
    'Memahami konsep dasar web development',
    'text',
    'sub',
    1,
    1,
    true,
    'published',
    true,
    20,
    '{"body": "<h3>Konsep Dasar Web</h3><p>Web development terdiri dari beberapa komponen:</p><ul><li><strong>Frontend:</strong> Bagian yang dilihat user</li><li><strong>Backend:</strong> Server dan database</li><li><strong>Full-stack:</strong> Kombinasi frontend dan backend</li></ul><p>Kita akan fokus pada frontend development terlebih dahulu.</p>"}',
    true
),
-- Sub-material 2.1: HTML Elements
(
    '8098f213-7d7d-4772-8e47-f264c8d91512',
    (SELECT id FROM user_profiles LIMIT 1),
    (SELECT id FROM learning_contents WHERE class_id = '8098f213-7d7d-4772-8e47-f264c8d91512' AND title = 'HTML Dasar' LIMIT 1),
    'HTML Elements',
    'Mempelajari elemen-elemen HTML',
    'text',
    'sub',
    1,
    0,
    true,
    'published',
    true,
    25,
    '{"body": "<h3>HTML Elements</h3><p>HTML memiliki banyak elemen untuk berbagai keperluan:</p><ul><li><strong>Headings:</strong> h1, h2, h3, h4, h5, h6</li><li><strong>Text:</strong> p, span, strong, em</li><li><strong>Lists:</strong> ul, ol, li</li><li><strong>Links:</strong> a</li><li><strong>Images:</strong> img</li></ul><p>Setiap elemen memiliki fungsi dan atribut yang berbeda.</p>"}',
    true
),
-- Sub-material 2.2: HTML Attributes
(
    '8098f213-7d7d-4772-8e47-f264c8d91512',
    (SELECT id FROM user_profiles LIMIT 1),
    (SELECT id FROM learning_contents WHERE class_id = '8098f213-7d7d-4772-8e47-f264c8d91512' AND title = 'HTML Dasar' LIMIT 1),
    'HTML Attributes',
    'Memahami atribut-atribut HTML',
    'text',
    'sub',
    1,
    1,
    true,
    'published',
    true,
    20,
    '{"body": "<h3>HTML Attributes</h3><p>Atribut memberikan informasi tambahan pada elemen HTML:</p><ul><li><strong>id:</strong> Identifier unik</li><li><strong>class:</strong> CSS class</li><li><strong>src:</strong> Source untuk gambar</li><li><strong>href:</strong> Link untuk anchor</li></ul><p>Contoh: &lt;img src=\"image.jpg\" alt=\"Deskripsi\"&gt;</p>"}',
    true
),
-- Sub-material 3.1: CSS Selectors
(
    '8098f213-7d7d-4772-8e47-f264c8d91512',
    (SELECT id FROM user_profiles LIMIT 1),
    (SELECT id FROM learning_contents WHERE class_id = '8098f213-7d7d-4772-8e47-f264c8d91512' AND title = 'CSS Styling' LIMIT 1),
    'CSS Selectors',
    'Mempelajari CSS selectors',
    'text',
    'sub',
    1,
    0,
    true,
    'published',
    true,
    30,
    '{"body": "<h3>CSS Selectors</h3><p>CSS selectors menentukan elemen mana yang akan di-style:</p><ul><li><strong>Element:</strong> p, h1, div</li><li><strong>Class:</strong> .class-name</li><li><strong>ID:</strong> #id-name</li><li><strong>Descendant:</strong> div p</li></ul><p>Contoh: .highlight { color: yellow; }</p>"}',
    true
),
-- Sub-material 3.2: CSS Properties
(
    '8098f213-7d7d-4772-8e47-f264c8d91512',
    (SELECT id FROM user_profiles LIMIT 1),
    (SELECT id FROM learning_contents WHERE class_id = '8098f213-7d7d-4772-8e47-f264c8d91512' AND title = 'CSS Styling' LIMIT 1),
    'CSS Properties',
    'Mempelajari CSS properties',
    'text',
    'sub',
    1,
    1,
    true,
    'published',
    true,
    25,
    '{"body": "<h3>CSS Properties</h3><p>CSS properties mengatur tampilan elemen:</p><ul><li><strong>Color:</strong> text color</li><li><strong>Background:</strong> background color</li><li><strong>Font:</strong> font family, size, weight</li><li><strong>Layout:</strong> margin, padding, display</li></ul><p>Contoh: p { color: blue; font-size: 16px; }</p>"}',
    true
);

-- Show result
SELECT 'Hierarchical content added!' as message;
SELECT 
    id,
    title,
    material_type,
    level,
    parent_id,
    order_index,
    estimated_duration
FROM learning_contents
WHERE class_id = '8098f213-7d7d-4772-8e47-f264c8d91512'
ORDER BY level, order_index;
