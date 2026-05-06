USE crochet_business1;

-- As there will be lots of times that I update multiple prices of my yarn, as SHEIN changes its prices constantly
-- I wanted to create a procedure that I can call to update all the rows in the cost_to_make column at once.
SELECT * FROM pattern;

ALTER TABLE pattern
MODIFY cost_to_make VARCHAR(20);

DELIMITER //
CREATE PROCEDURE update_cost_to_make()
BEGIN 
	UPDATE pattern p
	JOIN (
		SELECT 
			patt_need_id pattern_id,
			SUM(
				IF (
				pn.yarn_length_needed AND ys.cost_per_yard IS NOT NULL,
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
		SET p.cost_to_make = CONCAT("£", FORMAT(calc.total_cost, 2));
 
END	//
DELIMITER ;

CALL update_cost_to_make();
SELECT cost_to_make
FROM pattern;

-- -------------------------------------------------------------------------------------------
-- Updating the product price using the cost_to_make

SELECT * FROM product;

DELIMITER //
CREATE PROCEDURE update_product_cost()
BEGIN 
	UPDATE product pr
    JOIN pattern p ON pr.prod_pattern_id = p.pattern_id
    SET pr.price = 
		CONCAT("£",
			FORMAT(
				CAST(REPLACE(p.cost_to_make, "£", "") AS DECIMAL(10,2))
                + ((TIME_TO_SEC(CAST(p.time_to_make AS TIME)) / 3600) * 8), 2)
                );
END	//
DELIMITER ;

CALL update_product_cost();          
SELECT * FROM product; 
SELECT * FROM full_pattern_1_row;
       
-- When deciding on a project, it is helpful to know how long it will take to make. For example,
--  If I am going on a 1.5-hour car journey, I would want a project that I could finish in
-- that time. This is a function that I could use to pick my next project or for my customers
-- to decide what pattern they want to buy. 

DELIMITER //
CREATE FUNCTION project_length(time_to_make TIME)
RETURNS VARCHAR(200)
DETERMINISTIC
BEGIN
	DECLARE duration VARCHAR(200);
		IF time_to_make <= "00:59:00" THEN
			SET duration = "This is a short project that you will be able to make quickly.";
		ELSEIF time_to_make > "00:59:00" AND time_to_make <= "15:00:00" THEN
			SET duration = "This is a medium-length project that will take you a few sittings to make.";
		ELSEIF time_to_make > "15:00:00" AND time_to_make <= "40:00:00" THEN
			SET duration = "This is a fairly long project that takes a good few weeks to make";
		ELSE
			SET duration = "This is a very long project that will keep you busy for months";
		END IF;
        
        RETURN duration;
	
    END //
  DELIMITER ;   
  

-- I want to see all my patterns in order of how long they will take me to make, and I want them to start
-- from the shortest time to the longest time.
  SELECT 
	pattern_name AS "Pattern Name",
    project_length(time_to_make) AS duration,
    time_to_make AS "Time to Make"
  FROM pattern
  ORDER BY time_to_make ASC;
  
  
 -- I am going on a car ride and want to choose a pattern that I can make in less than 1 hour and 30 minutes
  SELECT 
	pattern_name AS " Pattern Name",
    time_to_make AS " Time to Make"
  FROM pattern
  WHERE time_to_make <= "01:30:00"
	ORDER BY time_to_make DESC;
   
-- I want a slightly longer project, but also don't have much cash at the moment, so I want a project that takes me
-- between 2 and 5 hours, and that costs less than £5 to make.
 
 SELECT 
	pattern_name AS "Pattern Name", 
    CONCAT("£", FORMAT(cost_to_make , 2)) AS "Cost to Make",
    time_to_make AS "Time to Make"
  FROM pattern 
  WHERE time_to_make BETWEEN "02:00:00" AND "05:00:00"
  AND CAST(REPLACE(cost_to_make, "£", "") AS DECIMAL(10,2)) <= "5"
   ORDER BY cost_to_make ASC;
  
-- I want to make a procedure where I can search for patterns that will make me the most profit
-- and that I can input the number of stock that I have or intend to have

SELECT * FROM yarn_stock;
DELIMITER //
CREATE PROCEDURE profit_if_skeins(IN threshold INT)
BEGIN  
SELECT 
	p.pattern_id AS "ID",
	p.pattern_name AS "Pattern Name",
	pr.price, 
	CONCAT("£", FORMAT(p.cost_to_make, 2)) AS "Cost to Make",
	CAST(REPLACE(pr.price, "£", "") AS DECIMAL(10,2))
    - 
    CAST(REPLACE(p.cost_to_make, "£", "") AS DECIMAL(10,2)) AS Profit
FROM pattern p
JOIN pattern_yarn_need py
	ON p.pattern_id = py.patt_need_id
JOIN yarn_stock ys
	ON ys.yarn_id = py.yarn_need_id
JOIN product pr
	ON pr.prod_pattern_id = p.pattern_id
WHERE ys.no_in_stock >= threshold
GROUP BY p.pattern_id, p.pattern_name
ORDER BY Profit DESC;

END//
DELIMITER ;

CALL profit_if_skeins(6);


-- check it works for no stock by reducing stock to 0 for one row
UPDATE yarn_stock
SET no_in_stock = 0
WHERE yarn_id IN (1);

UPDATE yarn_stock
SET no_in_stock = 0
WHERE yarn_id IN (5, 6, 7, 8);

CALL profit_if_skeins(1);

-- It worked, the bee and Anna shawl didn't show because the yarn was not in stock


-- create another procedure just to check if I have it in stock now, so I don't have to cross-reference

DELIMITER //
CREATE PROCEDURE profit_for_in_stock_yarn_a()
BEGIN  
SELECT 
	p.pattern_id AS "ID",
	p.pattern_name AS "Pattern Name",
	pr.price, 
	CONCAT("£", FORMAT(p.cost_to_make, 2)) AS "Cost to Make",
	CAST(REPLACE(pr.price, "£", "") AS DECIMAL(10,2))
    - 
    CAST(REPLACE(p.cost_to_make, "£", "") AS DECIMAL(10,2)) AS Profit
FROM pattern p
JOIN pattern_yarn_need py
	ON p.pattern_id = py.patt_need_id
JOIN yarn_stock ys
	ON ys.yarn_id = py.yarn_need_id
JOIN product pr
	ON pr.prod_pattern_id = p.pattern_id
WHERE ys.no_in_stock >= no_of_skeins_needed
GROUP BY p.pattern_id, p.pattern_name
ORDER BY Profit DESC;

END//
DELIMITER ;

CALL profit_for_in_stock_yarn_a();
    
-- I want to create a procedure that can show patterns from any keyword that I or a customer might search. 

DELIMITER //
CREATE PROCEDURE find_patterns(IN word VARCHAR (100))
BEGIN
	SELECT DISTINCT
	*
	FROM full_pattern_1_row
    WHERE `Pattern Name` LIKE CONCAT("%", word, "%")
    OR `Pattern Type` LIKE CONCAT("%", word, "%")
    ORDER BY `Pattern Name`;
END //
DELIMITER ;


CALL find_patterns("baby")
