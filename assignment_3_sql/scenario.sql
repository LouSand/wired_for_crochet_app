-- As someone who is obsessed with crochet, I have a range of projects and patterns in progress. I am always looking for new things, 
-- trying to figure out what yarn I have, what I need and trying to make space. I decided to create a database that will help me to
-- store and keep track of stock levels of the yarn/materials I have, give me specific information about stock, patterns and products that I make and 
-- sell. It would be great if I could monetise my hobby (I don't have the space to keep all my projects). 
-- (If time allows, I will add customers and their orders - but this may be how the project could be developed in the future)
-- I have given a more in-depth scenario in the relevant file.

-- 1. CREATE a database with at least 3 TABLES with several columns 
	-- Use at least 3 different data types
		-- 6 can be found in the pattern table - INT, VARCHAR, BOOLEAN/tinyint, time, decimal
        -- Use at least 2 constraints while creating tables
			-- NOT NULL
            -- CHECK under yarn-stock to make sure at least one of the columns, weight and length, is not null
            -- set UNIQUE for pattern name
            -- AUTO_INCREMENT for all IDS
    -- set FK where required. 
	-- I will need a table for: 
	-- yarn_stock - 
		-- id, 
		-- weight/length, 
		-- colour (even if it is the same name, I want a different ID so that I can specify the exact yarns needed to make a pattern
		-- cost (So I can work out how much a pattern/product takes to make)
        -- cost_per_length/gram (so I can work out how much it costs to make a particular pattern)
        -- no_in_stock (I would like to set an alert if below 2 skeins)
        
   -- pattern-
		-- id
        -- name varchar(100) 
        -- misc extras such as eyes or keyring 
			-- (in the real world, I would create another table for misc_stock, but for the sake of the assignment
			-- I may just do queries that add 30p onto the price if either of these is true. I will use a Boolean value 0 for false and 1 for true.
		-- time to make
			-- I can make a function using if, elseif to find if a project is long, medium or short.
            -- I want to add sort by to order projects by time
        -- type of pattern (baby, home decor, clothing, plushie) 
			-- I can create a query to look for patterns with these values, depending on what I want to make for my next project. 
		-- cost to make
			-- I want this to auto-update when all relevant fields have had data inserted into them
            -- so the sum of (yarn_needed * cost_per_yardorg) + 0.3 IF eyes and+ 0.3 if keyring
            -- I want to add sort by to order projects by price
            
-- I did have other categories, but realised that it would be better to create a separate table for yarn_needed and amount_needed
-- There may be multiple yarns used for one pattern, so this seemed the cleanest way to do it. 
-- I dropped the columns not needed

	-- pattern_yarn_need - junction table
		-- pattern_id  PK 
		-- yarn_id  PK 
		-- yarn_length_needed - I had made these an int at first, not thinking about the need for decimals to be more precise when calculating
		-- yarn_weight_needed - so I altered the data type when I started to write the query
		-- no_of_skeins_needed 
			-- I want this to be auto-calculated when I enter the length or weight needed
            
	-- product
        -- pattern_id - FK -altered this to something more unique so that there is less confusion when doing joins
        -- product_name - just have this as a foreign key from the pattern name 
		-- product_weight and product_length, so once selling, shipping costs can be worked out
        -- price
			-- Even though the cost to make is covered in pattern, I want to figure out how much I should sell my products for
			-- So want to use cost_to_make + (time_to_make * 8) 8 would be my hourly rate
		

-- 2. Populate the tables with data
		-- I will create some of the data myself (8 rows for 3 of the tables as required for the assignment)
        -- The rest I will populate ChatGPT. I want quite a lot of patterns to test my queries with 
			-- I did have to edit some of the data as it didn't quite fit the tables I had created. 
            -- Didn't add any stock to the product
            
-- 3. Create a function that allows me or a customer to check if a pattern will take a long, short or medium time to make. 
		-- Assignment_3_SQL\Function_check_duration_project.sql
        
		-- 3.b I am going on a 1.5-hour car journey, make a specific query to pull up all the projects
			-- I could finish in that time and sort by shortest to longest. 
            
-- 4. Scenario: when I check the patterns, I realise that I have managed to duplicate all of the patterns
	-- create a query to find all the duplicates
    -- delete the duplicated data
    -- make the pattern_name a unique field so that it can't happen again
		-- see patterns section in create_database

-- 5. I Crochet are notorious for buying yarn with no specific project in mind, just because it is cheap or looks pretty.
--  I want to work out how much stock it takes to make specific products.
	-- create a general query for if I have enough stock 
    -- create a query for if I am planning to get some in, or I know how many skiens I want to check.
    -- see queries

