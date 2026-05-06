CREATE DATABASE crochet_business1;
USE crochet_business1;

CREATE TABLE yarn_stock(
	yarn_id INT AUTO_INCREMENT PRIMARY KEY, 
	yarn_name VARCHAR(100) NOT NULL, 
	yarn_weight INT, -- this or the one below needs a value but both don't need to be inputted 
	yarn_length INT, 
	yarn_colour VARCHAR(30), 
	yarn_cost FLOAT, 
	cost_per_yard FLOAT, 
	cost_per_gr FLOAT, 
	no_in_stock INT
);  

ALTER TABLE yarn_stock
ADD CONSTRAINT check_weight_length
CHECK (yarn_weight IS NOT NULL OR yarn_length IS NOT NULL);

INSERT INTO yarn_stock
(yarn_name, yarn_weight, yarn_length, yarn_colour, yarn_cost, cost_per_yard, cost_per_gr, no_in_stock)
VALUES
("12mm chinille", 245, NULL, "yellow", 3.96, NULL, 0.02, 2),
("12mm chinille", 245, NULL, "white", 3.96, NULL, 0.02, 3),
("12mm chinille", 245, NULL, "black", 3.96, NULL, 0.02, 2),
("12mm chinille", 245, NULL, "purple", 3.96, NULL, 0.02, 1),
("gradient 4 thread yarn", 300, NULL, "red", NULL, 4.95, 0.02, 2),
("gradient 4 thread yarn", 300, NULL, "purple", NULL, 4.95, 0.02, 3),
("gradient 4 thread yarn", 300, NULL, "blue", NULL, 4.95, 0.02, 3),
("gradient 4 thread yarn", 300, NULL, "green", NULL, 4.95, 0.02, 2);

ALTER TABLE yarn_stock
MODIFY COLUMN cost_per_gr DECIMAL(10,2);

ALTER TABLE yarn_stock
MODIFY COLUMN cost_per_gr DECIMAL(20,2)
GENERATED ALWAYS AS (round(yarn_cost / yarn_weight, 2)) STORED;

ALTER TABLE yarn_stock
MODIFY COLUMN cost_per_yard DECIMAL(20,2)
GENERATED ALWAYS AS (round(yarn_cost / yarn_length, 2)) STORED;
-- changed float to decimal so that cost could be worked out and be precise

-- I want a default value in no_in_stock so when I query I can use < or > 
ALTER TABLE yarn_stock
MODIFY COLUMN no_in_stock INT DEFAULT 0;
USE crochet_business1;
SET SQL_SAFE_UPDATES = 0;
UPDATE yarn_stock
SET yarn_length = 500
WHERE yarn_length IS NULL 
	AND yarn_name = "gradient 4 thread yarn";
    
UPDATE yarn_stock
SET yarn_cost = 4.99
where (yarn_cost IS NULL OR yarn_cost = '') 
	and yarn_name = "gradient 4 thread yarn"
    and yarn_colour = "blue" ;

UPDATE yarn_stock
SET yarn_cost = 5.75
where (yarn_cost IS NULL OR yarn_cost = '') 
	and yarn_name = "gradient 4 thread yarn"
    and yarn_colour = "red";

UPDATE yarn_stock
SET yarn_cost = 5.33
WHERE (yarn_cost IS NULL OR yarn_cost = '') 
	and yarn_name = "gradient 4 thread yarn"
    and yarn_colour = "purple" or yarn_colour = "green";
    
UPDATE yarn_stock
SET yarn_length = 150
WHERE yarn_id IN (1, 2, 3, 4);

UPDATE yarn_stock
SET yarn_length = 900
WHERE yarn_id IN (9, 19);

UPDATE yarn_stock
SET yarn_weight = 300
WHERE yarn_id IN (16);

UPDATE yarn_stock
SET yarn_weight = 500
WHERE yarn_id IN (10);

SET SQL_SAFE_UPDATES = 0;
-- AI Generated data ------------------------------------------------------------------
INSERT INTO yarn_stock
(yarn_name, yarn_weight, yarn_length, yarn_colour, yarn_cost, no_in_stock)
VALUES
("Merino Superwash", 200, NULL, "cream", 4.50, 5),
("Australian Wool", NULL, 150, "navy", 5.20, 3),
("Alpaca Blend", 180, 120, "grey", 6.10, 4),
("Cotton DK", 220, NULL, "peach", 3.80, 6),
("Silk & Wool Mix", 160, 100, "pink", 7.25, 3),
("Cashmere Fine", 150, 80, "white", 8.50, 2),
("Aran Wool", 250, NULL, "forest green", 4.75, 4),
("Bamboo Cotton", NULL, 140, "yellow", 4.20, 5),
("Tweed Chunky", 300, NULL, "brown", 5.60, 3),
("Alpaca Luxury", 200, 110, "cream & brown", 6.80, 2),
("Merino Worsted", 220, NULL, "orange", 5.00, 4),
("Australian Sock Wool", 180, 120, "multi", 6.00, 3),
("Cotton Cord 9mm", 350, NULL, "white", 9.50, 3),
("Luxe Silk Blend", 140, 90, "lavender", 12.00, 2),
("Merino Cashmere Mix", 180, 100, "light grey", 10.50, 4),
("Alpaca Baby Soft", 160, 80, "pastel pink", 11.20, 2),
("Hand-dyed Wool", 200, NULL, "teal", 9.75, 3),
("Superfine Merino", 150, 100, "cream", 10.00, 5),
("Organic Cotton DK", 220, NULL, "mint", 8.25, 4),
("Silk Thread 5ply", 100, 120, "gold", 13.00, 1),
("Luxury Wool Blend", 250, 150, "burgundy", 11.50, 2),
("Alpaca Chunky", 300, NULL, "camel", 9.90, 3),
("Bamboo Silk Mix", 180, 110, "sky blue", 12.75, 2),
("Pima Cotton", 200, NULL, "cream", 8.80, 4),
("Cashmere Merino Aran", 250, NULL, "dark grey", 13.50, 2),
("Organic Merino Sock", 180, 120, "multi", 10.20, 3),
("Cotton Cord 6mm", 250, NULL, "red", 7.95, 5),
("Silk & Linen Blend", 160, 100, "beige", 11.80, 2),
("Luxury Alpaca Mix", 200, 130, "ivory", 12.50, 2),
("Fine Merino Lace", 120, 150, "soft pink", 14.00, 1),
("Cotton Cord 9mm", 1200, 100, "red", 20.00, 2),
("Cotton Cord 9mm", 1200, 100, "blue", 20.00, 2),
("Cotton Cord 9mm", 1200, 100, "green", 20.00, 2);

-- if get time but not necessary for assignment, add another column, yarn_thickness for 4ply, etc


-- ---------------------------------------------------------------------------------------------------------------------------
CREATE TABLE pattern(
	pattern_id INT AUTO_INCREMENT PRIMARY KEY, 
	pattern_name VARCHAR (100) NOT NULL, 
	-- yarn_id INT NOT NULL, -- This is a many-to-many so need to remove this and create another table
	eyes BOOLEAN, -- If I made the project larger, I would create a misc_stock table and add these and the keyring to that, so it is easier to update prices, etc
	keyring BOOLEAN,
	no_of_skeins_needed INT, -- move this to pattern_yarn_need table
	time_to_make TIME, 
	type_of_pattern VARCHAR(50), 
	colours_needed VARCHAR(30), -- This should be in my other table -- delete from table
	cost_to_make DECIMAL(10,2)
--  FOREIGN KEY (yarn_id) REFERENCES yarn_stock(yarn_id) -- moved this to a junction table as there will be more than one yarn_id per pattern
);

-- -------------------------------------------------------------------------------------------------------------------
-- adding data row by row
SELECT * FROM pattern;
INSERT INTO pattern
(pattern_id, pattern_name, eyes, keyring, no_of_skeins_needed, time_to_make, type_of_pattern, colours_needed)
VALUES
(1, "Bee", 1, 0, 1, "00:45:00", "plushie", "black, yellow, white");

INSERT INTO pattern
(pattern_name, eyes, keyring, no_of_skeins_needed, time_to_make, type_of_pattern, colours_needed)
VALUES
("Anna Shawl", 0, 0, 1, "00:45:00", "clothing", "Gradient yarn");

INSERT INTO pattern
(pattern_name, eyes, keyring, no_of_skeins_needed, time_to_make, type_of_pattern, colours_needed)
VALUES
("Moses Basket", 0, 0, 6, "40:00:00", "baby", "Red, Blue, Green");
SELECT * FROM pattern;
ALTER TABLE pattern
DROP COLUMN no_of_skeins_needed,
DROP COLUMN colours_needed;
-- no longer needed once I created the junction table that holds an ID for the yarn, which has individual IDs for colour
-- and no longer needed no_of_skeins_needed, as that needed to be in the junction table.


INSERT INTO pattern
(pattern_name, eyes, keyring, time_to_make, type_of_pattern)
VALUES
("Worry Worm", 1, 0, "50:00:00", "fidget toy"),
("Single Popit", 0, 1, "55:00:00", "fidget toy"),
("Caterpillar twist", 1, 0, "01:30:00", "fidget toy"),
("Hexi Toy", 0, 1, "01:50:00", "fidget toy"),
("Beaded Hedgehog", 1, 0, "03:30:00", "fidget toy");

-- AI-generated data ---------------------------------------------------------------------------------------------------
INSERT INTO pattern
(pattern_name, eyes, keyring, time_to_make, type_of_pattern)
VALUES
("Anna Shawl", 0, 0, "120:45:00", "clothing"),
("Bunny Plush", 2, 0, "02:30:00", "plushie"),
("Mini Octopus", 2, 1, "01:15:00", "plushie"),
("Sunflower Coaster", 0, 0, "00:40:00", "home decor"),
("Fox Keychain", 2, 1, "01:00:00", "accessory"),
("Winter Beanie", 0, 0, "03:00:00", "clothing"),
("Penguin Plush", 2, 0, "04:15:00", "plushie"),
("Granny Square Blanket", 0, 0, "70:00:00", "home decor"),
("Cup Cozy", 0, 0, "00:30:00", "accessory"),
("Daisy Hair Clip", 0, 1, "00:20:00", "accessory"),
("Cosy Cardigan", 0, 0, "55:30:00", "clothing"),
("Striped Jumper", 0, 0, "60:45:00", "clothing"),
("Summer Tank Top", 0, 0, "22:20:00", "clothing"),
("Chunky Scarf", 0, 0, "04:10:00", "clothing"),
("Fingerless Gloves", 0, 0, "02:50:00", "clothing"),
("Mini Heart Keychain", 0, 1, "00:15:00", "accessory"),
("Tiny Star Garland", 0, 0, "00:20:00", "home decor"),
("Coffee Cup Coaster", 0, 0, "00:25:00", "home decor"),
("Mini Bear Plush", 1, 0, "00:40:00", "plushie"),
("Flower Hairpin", 0, 1, "00:18:00", "accessory"),
("Simple Headband", 0, 0, "00:50:00", "clothing"),
("Tiny Owl Keyring", 1, 1, "00:35:00", "accessory"),
("Mini Pumpkin", 0, 0, "00:30:00", "home decor"),
("Star Ornament", 0, 0, "00:20:00", "home decor"),
("Little Cat Plush", 1, 0, "00:45:00", "plushie"),
("Baby Booties", 0, 0, "01:00:00", "baby"),
("Mini Bear Plush", 1, 0, "00:40:00", "plushie"),
("Flower Hairpin", 0, 1, "00:18:00", "accessory"),
("Simple Headband", 0, 0, "00:50:00", "clothing"),
("Tiny Owl Keyring", 1, 1, "00:35:00", "accessory"),
("Mini Pumpkin", 0, 0, "00:30:00", "home decor"),
("Star Ornament", 0, 0, "00:20:00", "home decor"),
("Little Cat Plush", 1, 0, "00:45:00", "plushie"),
("Baby Booties", 0, 0, "01:00:00", "baby"),
("Baby Hat", 0, 0, "00:45:00", "baby"),
("Baby Blanket", 0, 0, "08:30:00", "baby"),
("Baby Sweater", 0, 0, "04:20:00", "baby"),
("Baby Bib", 0, 0, "00:30:00", "baby");

-- ---------------------------------------------------------------------------------------------------------------------------------------------
-- Scenario - I duplicated a name, so I updated it
UPDATE pattern
SET pattern_name = 'Anna Bandana'
WHERE pattern_name = 'Anna Shawl'
AND time_to_make = '00:45:00';

UPDATE pattern
SET eyes = 1
WHERE eyes = 2;

-- I want to make the pattern_name unique. I first need to check that there are no duplicate names
SELECT *
FROM pattern
WHERE pattern_name IN (
	SELECT pattern_name
    FROM pattern
    GROUP  BY pattern_name
	HAVING COUNT(pattern_name) > 1 
    );
    -- This does show me the duplicates, but it isn't particularly user-friendly as I still have to scroll through the list to 
    -- find the numbers of the duplicate IDs. I want to get rid of one set of duplicate IDS

SELECT MAX(pattern_id) AS delete_id, pattern_name
FROM pattern
GROUP BY pattern_name, time_to_make
HAVING COUNT(*) > 1 ;
	
    -- I have input the data twice, so I need to delete all the rows between 35 and 42
DELETE FROM pattern
WHERE pattern_id BETWEEN 35 AND 42;

ALTER TABLE pattern
ADD UNIQUE (pattern_name);



-- --------------------------------------------------------------------------------------------------------------------------
-- CREATE TABLE pattern_length_weight(
-- yard_weight_id INT AUTO_INCREMENT PRIMARY KEY,
-- pattern_id INT NOT NULL,
-- yarn_length_needed INT, 
-- yarn_weight_needed INT,
-- no_of_skeins_needed INT,
-- FOREIGN KEY (pattern_id) REFERENCES pattern(pattern_id)
-- ); 
-- -- these would be better in a junction table created for the pattern and type of yarn used, then all queries to do with 
-- -- yarn will be in one place and easier to get to, as the weight/length is linked to the yarn specified for each pattern
-- -- I will then be able to work out the cost of the pattern using the two tables
-- DROP TABLE pattern_length_weight;

-- ---------------------------------------------------------------------------------------------------------------------------------

CREATE TABLE  pattern_yarn_need(
	yarn_need_id INT NOT NULL, 
	patt_yarn_id INT NOT NULL, -- change this name to patt_need_id -- tired mistake
    yarn_length_needed DECIMAL(10,0),
    yarn_weight_needed DECIMAL(10,0),
    PRIMARY KEY (yarn_need_id, patt_yarn_id)
);
-- pattern_yarn_need --------------------------------------------------------------------------------------------------------
ALTER TABLE pattern_yarn_need
RENAME COLUMN patt_yarn_id to patt_need_id;

ALTER TABLE pattern_yarn_need
ADD CONSTRAINT fk_pattern_id
FOREIGN KEY (patt_need_id)
REFERENCES pattern(pattern_id);

ALTER TABLE pattern_yarn_need
ADD CONSTRAINT fk_yarn_id
FOREIGN KEY (yarn_need_id)
REFERENCES yarn_stock(yarn_id);

INSERT INTO pattern_yarn_need 
	(patt_need_id, yarn_need_id, yarn_length_needed, yarn_weight_needed)
VALUE 
	(1, 3, NULL, 40);
    
    
INSERT INTO pattern_yarn_need 
	(patt_need_id, yarn_need_id, yarn_length_needed, yarn_weight_needed)
VALUE 
	(1, 1, NULL, 40),
	(3, 6, NULL, 300),
	(2, 6, NULL, 100),
	(4, 4, 20, NULL),
	(4, 2, 40, NULL),
	(8, 10, NULL, 150),
	(13, 18, NULL, 900), 
	(6,  16, NULL, 40),
    (6, 17, NULL, 40),
	(6, 15, NULL, 40);
    
    -- AI Generated Data -------------------------------------------------------------------------------------
    INSERT INTO pattern_yarn_need 
    (patt_need_id, yarn_need_id, yarn_length_needed, yarn_weight_needed)
VALUES
-- Mini Octopus
(11, 7, NULL, 50),   -- Blue (Gradient 4 Thread Yarn)
(11, 3, 15, NULL),   -- Black (12mm Chenille)

-- Fox Keychain
(13, 19, 10, NULL),  -- Orange (Merino Worsted)
(13, 2, NULL, 15),   -- White (12mm Chenille)
(13, 3, 8, NULL),    -- Black (12mm Chenille)

-- Penguin Plush
(15, 3, NULL, 80),   -- Black (12mm Chenille)
(15, 2, 30, NULL),   -- White (12mm Chenille)
(15, 19, NULL, 40),  -- Orange (Merino Worsted)

-- Granny Square Blanket
(16, 5, 500, 250),   -- Red (Gradient 4 Thread Yarn)
(16, 6, 400, 200),   -- Purple (Gradient 4 Thread Yarn)
(16, 7, 350, 180),   -- Blue (Gradient 4 Thread Yarn)
(16, 8, 350, 180),   -- Green (Gradient 4 Thread Yarn)

-- Cup Cozy
(17, 5, NULL, 25),   -- Red (Gradient 4 Thread Yarn)
(17, 2, 15, NULL),   -- White (12mm Chenille)

-- Daisy Hair Clip
(18, 1, 5, NULL),    -- Yellow (12mm Chenille)
(18, 2, NULL, 10),   -- White (12mm Chenille)
(18, 8, 5, NULL),    -- Green (Gradient 4 Thread Yarn)

-- Striped Jumper
(20, 10, 600, 400),  -- Navy (Australian Wool)
(20, 2, 250, NULL),  -- White (12mm Chenille)

-- Summer Tank Top
(21, 12, 120, 140),  -- Peach (Cotton DK)

-- Chunky Scarf
(22, 15, NULL, 500), -- Forest Green (Aran Wool)

-- Fingerless Gloves
(23, 29, 30, 40),    -- Burgundy (Luxury Wool Blend)
(23, 11, 20, 25),    -- Grey (Alpaca Blend)

-- Mini Heart Keychain
(24, 5, 8, NULL),    -- Red (Gradient 4 Thread Yarn)
(24, 13, NULL, 15),  -- Pink (Silk & Wool Mix)

-- Tiny Star Garland
(25, 1, 6, 8),       -- Yellow (12mm Chenille)
(25, 2, 5, 7),       -- White (12mm Chenille)

-- Coffee Cup Coaster
(26, 17, NULL, 30),  -- Brown (Tweed Chunky)
(26, 9, 20, NULL),   -- Cream (Merino Superwash)

-- Mini Bear Plush
(27, 9, 12, 15),     -- Cream (Merino Superwash)
(27, 17, 10, 12),    -- Brown (Tweed Chunky)

-- Flower Hairpin
(28, 2, 4, 5),       -- White (12mm Chenille)
(28, 1, 3, 4),       -- Yellow (12mm Chenille)

-- Simple Headband
(29, 7, 15, 20),     -- Blue (Gradient 4 Thread Yarn)

-- Tiny Owl Keyring
(30, 17, 6, 8),      -- Brown (Tweed Chunky)
(30, 19, 4, 6),      -- Orange (Merino Worsted)

-- Mini Pumpkin
(31, 19, 5, 6),      -- Orange (Merino Worsted)
(31, 8, 6, 8),       -- Green (Gradient 4 Thread Yarn)

-- Star Ornament
(32, 28, 2, 3),      -- Gold (Silk Thread 5ply)
(32, 2, 3, 4),       -- White (12mm Chenille)

-- Little Cat Plush
(33, 11, 8, 10),     -- Grey (Alpaca Blend)
(33, 13, 5, 6),      -- Pink (Silk & Wool Mix)

-- Moses Basket
(3, 39, 50, 600),    -- Red (Cotton Cord 9mm)
(3, 40, 45, 580),    -- Blue (Cotton Cord 9mm)
(3, 41, 40, 550),    -- Green (Cotton Cord 9mm)

-- Baby Booties
(34, 2, 8, 10),      -- White (12mm Chenille)
(34, 13, 5, 6),      -- Pink (Silk & Wool Mix)

-- Baby Hat
(43, 7, 12, 15),     -- Blue (Gradient 4 Thread Yarn)
(43, 9, 10, 12),     -- Cream (Merino Superwash)

-- Baby Blanket
(44, 1, 60, 70),     -- Yellow (12mm Chenille)
(44, 2, 50, 60),     -- White (12mm Chenille)
(44, 8, 55, 65),     -- Green (Gradient 4 Thread Yarn)

-- Baby Sweater
(45, 11, 40, 50),    -- Grey (Alpaca Blend)
(45, 2, 35, 40),     -- White (12mm Chenille)

-- Baby Bib
(46, 5, 10, 12),     -- Red (Gradient 4 Thread Yarn)
(46, 2, 8, 10),      -- White (12mm Chenille)

-- Worry Worm
(4, 15, 20, 30),     -- Forest Green (Aran Wool)

-- Single Popit
(5, 7, 25, 35),      -- Blue (Gradient 4 Thread Yarn)

-- Caterpillar Twist
(6, 19, 30, 40),     -- Orange (Merino Worsted)
(6, 2, 25, 30),      -- White (12mm Chenille)

-- Hexi Toy
(7, 6, 40, 45),      -- Purple (Gradient 4 Thread Yarn)
(7, 5, 30, 35),      -- Red (Gradient 4 Thread Yarn)

-- Beaded Hedgehog
(8, 17, 50, 60),     -- Brown (Tweed Chunky)
(8, 2, 40, 50);      -- White (12mm Chenille)

INSERT INTO pattern_yarn_need 
    (patt_need_id, yarn_need_id, yarn_length_needed, yarn_weight_needed)
VALUES
-- Anna Shawl (pattern_id = 9)
(9, 7, 400, 250),     -- Blue (Gradient 4 Thread Yarn)
(9, 6, 300, 200),     -- Purple (Gradient 4 Thread Yarn)

-- Bunny Plush (pattern_id = 10)
(10, 3, 50, 100),     -- Black (12mm Chenille)
(10, 2, 30, 80),      -- White (12mm Chenille)
(10, 19, 10, 40),     -- Orange (Merino Worsted)

-- Sunflower Coaster (pattern_id = 12)
(12, 1, 10, 20),      -- Yellow (12mm Chenille)
(12, 17, 5, 10),      -- Brown (Tweed Chunky)
(12, 8, 5, 10),       -- Green (Gradient 4 Thread Yarn)

-- Winter Beanie (pattern_id = 14)
(14, 11, 300, 400),   -- Grey (Alpaca Blend)
(14, 2, 100, 120),    -- White (12mm Chenille)

-- Cosy Cardigan (pattern_id = 19)
(19, 12, 800, 1000),  -- Cream (Cotton DK)
(19, 15, 500, 600),   -- Forest Green (Aran Wool)
(19, 9, 300, 400);    -- Brown (Merino Superwash);


-- ---------------------------------------------------------------------------------------------------------------------------------------------

UPDATE pattern_yarn_need
SET yarn_weight_needed = 50
WHERE patt_need_id = 1;

ALTER TABLE pattern_yarn_need
ADD COLUMN no_of_skeins_needed INT;

ALTER TABLE pattern_yarn_need
ADD CONSTRAINT check_pat_yarn_need
CHECK (yarn_length_needed IS NOT NULL OR yarn_weight_needed IS NOT NULL);

DESCRIBE pattern_yarn_need;

UPDATE pattern_yarn_need AS py
	JOIN yarn_stock AS ys
		ON ys.yarn_id = py.yarn_need_id
	SET py.no_of_skeins_needed = ceiling(py.yarn_weight_needed / ys.yarn_weight)
	WHERE ys.yarn_weight IS NOT NULL AND py.yarn_weight_needed IS NOT NULL;

UPDATE pattern_yarn_need AS py
	JOIN yarn_stock AS ys
		ON ys.yarn_id = py.yarn_need_id
	SET py.no_of_skeins_needed = ceiling(py.yarn_length_needed / ys.yarn_length)
	WHERE ys.yarn_length IS NOT NULL AND py.yarn_length_needed IS NOT NULL;
    
SELECT * FROM pattern_yarn_need
WHERE no_of_skeins_needed IS NULL;
SELECT * FROM yarn_stock;
-- -----------------------------------------------------------------------------------------------------------------------------------------

CREATE TABLE product(
		prod_pattern_id INT PRIMARY KEY,
		product_name VARCHAR(100), -- set as a FK --in ALTER TABLES
		price DECIMAL(10,2)
);
	-- product_weight INT,  --- add these if made a bigger project with postage costs
	-- product_length INT, 

-- product ---------------------------------------------------------------------------------------------------------------------------------
ALTER TABLE product
ADD CONSTRAINT fk_prod_pattern_id
FOREIGN KEY (prod_pattern_id)
REFERENCES pattern(pattern_id);

ALTER TABLE product
ADD CONSTRAINT fk_product_name
FOREIGN KEY (product_name)
REFERENCES pattern(pattern_name);

DELIMITER //
CREATE PROCEDURE populate_products()
BEGIN
	INSERT INTO product(prod_pattern_id, product_name)
    SELECT pattern_id, pattern_name
    FROM pattern
    WHERE pattern_id NOT IN (SELECT prod_pattern_id FROM product);
    END//

DELIMITER ;

ALTER TABLE product
ADD COLUMN no_in_stock INT;

ALTER TABLE product
MODIFY price VARCHAR(15);

ALTER TABLE product
MODIFY no_in_stock INT DEFAULT 0;

UPDATE product
SET no_in_stock = 0
WHERE no_in_stock IS NULL;

CALL populate_products();

SELECT * FROM product;

-- ------------------------------------------------------------------------------------------------------------------------------------------------
-- User-friendly VIEW --all relevant information when looking at patterns -----------------------------------------------------------------------
-- I want to create a VIEW where I can see everything in one place, without having to cross-reference IDs. Also, if I were to sell my patterns, 
-- customers could see only the information I want them to see. 
-- I want the boolean values to be converted into a string. Yes or no. 

CREATE OR REPLACE VIEW full_pattern_b 
AS
	SELECT 
		p.pattern_id AS "ID",
		p.pattern_name AS "Pattern Name",
		p.type_of_pattern AS "Pattern Type",
		p.time_to_make AS "Time",
		CONCAT(ys.yarn_id, ':  ' , ys.yarn_name, ", ", py.no_of_skeins_needed) AS " Yarn ID, Name, Skeins Needed",
		CONCAT(py.yarn_length_needed, 'm') AS "Length of Yarn",
		CONCAT(py.yarn_weight_needed, 'g') AS "Weight of yarn",
		ys.yarn_colour  AS " Colour",
		IF (eyes = 1, "yes", "no") AS "Safety Eyes Needed",
		IF (keyring = 1, "yes", "no") AS "Keychain",
		p.cost_to_make AS "Cost to Make",
		pr.price AS "Sell For"
FROM pattern p
JOIN pattern_yarn_need py
	ON p.pattern_id = py.patt_need_id
JOIN yarn_stock ys
	ON ys.yarn_id = py.yarn_need_id
JOIN product pr
	ON pr.prod_pattern_id = p.pattern_id;
--  
DELIMITER //
CREATE PROCEDURE update_cost_to_make()
BEGIN 
	UPDATE pattern p
	JOIN (
		SELECT 
			patt_need_id pattern_id,
			SUM(
				IF (
				pn.yarn_length_needed and ys.cost_per_yard IS NOT NULL,
				(pn.yarn_length_needed * ys.cost_per_yard) 
				+ CASE WHEN p2.eyes = 1 THEN 0.30 ELSE 0 END
				+ CASE WHEN p2.keyring = 1 THEN 0.60 ELSE 0 END,
				(pn.yarn_weight_needed * ys.cost_per_gr) 
				+ CASE WHEN p2.eyes = 1 THEN 0.30 ELSE 0 END
				+ CASE WHEN p2.keyring = 1 THEN 0.60 ELSE 0 END
					)
				)
                AS total_cost
		FROM pattern_yarn_need pn
		JOIN yarn_stock ys ON pn.yarn_need_id = ys.yarn_id
        JOIN pattern p2 ON p2.pattern_id = pn.patt_need_id
		GROUP BY pn.patt_need_id	
        )
        AS calc ON p.pattern_id = calc.pattern_id
        SET p.cost_to_make = FORMAT(calc.total_cost, 2);
 
END //

DELIMITER ;  

CALL update_cost_to_make();



    -- next steps -- make it so that there is only one row with all the information on
		-- so there would only be 1 row for bee, and the names and yarn name would only show once if a duplicate name, the colours
        -- would be in one row separated with ,
  
CREATE OR REPLACE VIEW full_pattern_1_row 
AS
        SELECT 
			`ID`,
			`Pattern Name`,
            `Pattern Type`,
            `Time`,
			GROUP_CONCAT(`Yarn ID, Name, Skeins Needed` ORDER BY `Yarn ID, Name, Skeins Needed` SEPARATOR ",  ") AS " Yarn ID, Name, Skeins Needed",
			GROUP_CONCAT(`Length of Yarn` ORDER BY `Length of Yarn`  SEPARATOR ", ") AS "Length of Yarn",
			GROUP_CONCAT(`Weight of yarn`  ORDER BY `Weight of yarn` SEPARATOR ", ") AS "Weight of yarn",
			GROUP_CONCAT(`Colour` ORDER BY `Colour` SEPARATOR ", ")  AS " Colour",
          	`Safety Eyes Needed`,
			`Keychain`,
			`Cost to Make`,
			`Sell For`       
		FROM full_pattern_b
        GROUP BY `ID`;

SELECT * FROM full_pattern_1_row; 



 -- created these tables for if I have time to do a bigger project.
-- CREATE TABLE customer(
-- 	cust_id INT AUTO_INCREMENT PRIMARY KEY,
-- 	cust_first_name VARCHAR(20) NOT NULL,
-- 	cust_last_name VARCHAR(30) NOT NULL,
-- 	subscriber BOOLEAN NOT NULL
-- );

-- CREATE TABLE customer_contacts(
-- 	contact_id INT AUTO_INCREMENT PRIMARY KEY,
-- 	cust_id INT NOT NULL,
-- 	cust_phone VARCHAR(20), -- one of these must be filled out
-- 	cust_email VARCHAR(50),
-- 	FOREIGN KEY (cust_id) REFERENCES customer(cust_id)
-- );

-- CREATE TABLE cust_addresses(
-- 	address_id INT AUTO_INCREMENT PRIMARY KEY,
-- 	cust_id INT NOT NULL,
-- 	alt_name VARCHAR(100), -- for if they aren't sending to their own address
-- 	address_number VARCHAR(20) NOT NULL,
-- 	street VARCHAR(50) NOT NULL,
-- 	town VARCHAR(50) NOT NULL,
-- 	country VARCHAR(30) NOT NULL,
-- 	post_code VARCHAR(20) NOT NULL,
-- 	FOREIGN KEY (cust_id) REFERENCES customer(cust_id)
-- );


-- CREATE TABLE orders(
-- 	order_id INT AUTO_INCREMENT PRIMARY KEY,
-- 	cust_id INT NOT NULL,
-- 	address_id INT NOT NULL, 
-- 	order_date DATE NOT NULL,
-- 	order_status VARCHAR(20), -- processing, packed, dispatched, delivered (can I add that it has to have one of these options- or will it need to be another table with an id for each?)
-- 	order_price DECIMAL(10,2),
-- 	delivery_price DECIMAL(10,2), -- fk to postage prices if time to do another table
-- 	total_cost DECIMAL(10,2),
-- 	FOREIGN KEY (cust_id) REFERENCES customer(cust_id),
-- 	FOREIGN KEY (address_id) REFERENCES cust_addresses(address_id)
-- );


-- CREATE TABLE misc_stock(
-- 	misc_id INT AUTO_INCREMENT PRIMARY KEY, 
-- 	misc_name VARCHAR(100) NOT NULL, 
-- 	misc_weight INT, -- this or the one below needs a value, but both don't need to be inputted 
-- 	misc_length INT, 
-- 	misc_colour VARCHAR(30), 
-- 	misc_cost DECIMAL(10,2), 
-- 	cost_per_length DECIMAL(10,2), -- this or the one needs to be filled in, in line with weight or length above
-- 	cost_per_gr DECIMAL(10,2), 
-- 	no_in_stock INT
-- );
-- if time, create a table for postage prices
