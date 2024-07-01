use test;
-- select custid fro table group by custid count cust id 
-- select count(orders.orders_id), orders.customer_id from orders group by customer_id;

SELECT customers.customer_name, products.product_name, COUNT(order_details.quantity) as order_amount, SUM(order_details.quantity) as total_Quantity 
FROM customers, order_details, orders, products
WHERE 
orders.orders_id = order_details.order_id and 
customers.customer_id = orders.customer_id and
order_details.product_id = products.product_id
GROUP BY customers.customer_name , products.product_name

-- 11:46:05	SELECT customers.customer_name, products.product_name, COUNT(order_details.quantity) as order_amount, SUM(order_details.quantity) as total_Quantity  
-- FROM customers, order_details, orders, products WHERE  orders.orders_id = order_details.order_id and  customers.customer_id = orders.customer_id  
-- GROUP BY customers.customer_name AND products.product_name LIMIT 0, 1000	
-- Error Code: 1055. Expression #1 of SELECT list is not in GROUP BY clause and contains nonaggregated column 'test.customers.customer_name' which is not functionally dependent on columns in GROUP BY clause; this is incompatible with sql_mode=only_full_group_by	0.063 sec
