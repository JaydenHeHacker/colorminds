-- Delete all coloring pages with base64 images (test data)
DELETE FROM coloring_pages 
WHERE image_url LIKE 'data:image%';