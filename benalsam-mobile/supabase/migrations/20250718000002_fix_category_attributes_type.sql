-- Fix category_attributes type constraint to include multiselect
ALTER TABLE category_attributes 
DROP CONSTRAINT IF EXISTS category_attributes_type_check;

ALTER TABLE category_attributes 
ADD CONSTRAINT category_attributes_type_check 
CHECK (type IN ('string', 'number', 'boolean', 'array', 'multiselect')); 