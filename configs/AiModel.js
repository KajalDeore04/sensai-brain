const {
    GoogleGenerativeAI,
    HarmCategory,
    HarmBlockThreshold,
  } = require("@google/generative-ai");
  
  const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
  const genAI = new GoogleGenerativeAI(apiKey);
  
  const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash", //model version
  });
  
  const generationConfig = {
    temperature: 1,
    topP: 0.95,
    topK: 40,
    maxOutputTokens: 8192,
    responseMimeType: "application/json", //parsed in json
  };
  
  
    export const GenerateCourseLayout_AI = model.startChat({
      generationConfig,
      history: [ //takes reference from this for next output
        {
          role: "user",
          parts: [
            {text: "Generate a Course tutorial on following detail with field as course name, description, along with the chapter name, about, duration: Category:'Programming',Topic:Python,Level:Basic, Duration:1 hour, NoOfChapters:5, in JSON format\n"},
          ],
        },
        {
          role: "model",
          parts: [
            {text: "```json\n{\n  \"courseName\": \"Introduction to Python Programming\",\n  \"description\": \"A beginner-friendly course designed to introduce you to the fundamentals of Python programming. Learn about data types, control flow, functions, and basic problem-solving techniques. No prior programming experience required!\",\n  \"category\": \"Programming\",\n  \"topic\": \"Python\",\n  \"level\": \"Basic\",\n  \"duration\": \"1 hour\",\n  \"noOfChapters\": 5,\n  \"chapters\": [\n    {\n      \"chapterName\": \"Chapter 1: Getting Started with Python\",\n      \"about\": \"This chapter covers the basics of Python installation, setup, and running your first Python program. You'll learn about the Python interpreter and how to use a simple code editor.\",\n      \"duration\": \"10 minutes\"\n    },\n    {\n      \"chapterName\": \"Chapter 2: Data Types and Variables\",\n      \"about\": \"Learn about fundamental data types in Python, including integers, floats, strings, and booleans.  Understand how to declare variables and assign values to them.  Also covers basic input/output using the `input()` and `print()` functions.\",\n      \"duration\": \"15 minutes\"\n    },\n    {\n      \"chapterName\": \"Chapter 3: Operators and Control Flow\",\n      \"about\": \"Explore different types of operators in Python (arithmetic, comparison, logical). Learn about conditional statements (`if`, `elif`, `else`) and looping structures (`for`, `while`) to control the flow of your program.\",\n      \"duration\": \"15 minutes\"\n    },\n    {\n      \"chapterName\": \"Chapter 4: Functions\",\n      \"about\": \"Understand the concept of functions in Python. Learn how to define and call functions with and without arguments.  Covers return values and basic function scope.\",\n      \"duration\": \"10 minutes\"\n    },\n    {\n      \"chapterName\": \"Chapter 5: Basic Data Structures: Lists\",\n      \"about\": \"Introduction to Python lists, a fundamental data structure for storing collections of items.  Learn how to create lists, access elements, modify lists, and perform basic list operations.\",\n      \"duration\": \"10 minutes\"\n    }\n  ]\n}\n```\n"},
          ],
        },
      ],
    });


    export const GenerateChapterContent_AI = model.startChat({
      generationConfig,
      history: [
        {
          role: "user",
          parts: [
            {text: "Explain the concept in detail on Topic: Advanced SQL , Chapter: Joins, in JSON format with list of array with field as title , explanation on given chapter in detail, code example(code field in <precode> format if applicable\n"},
          ],
        },
        {
          role: "model",
          parts: [
            {text: "```json\n{\n  \"chapter\": \"Joins - Advanced SQL\",\n  \"description\": \"Joins are crucial in SQL for combining data from multiple tables based on related columns. Advanced join concepts involve understanding different join types and their applications in complex queries.  They allow you to retrieve data that is spread across different tables, effectively building a consolidated view based on shared attributes.\",\n  \"topics\": [\n    {\n      \"title\": \"Introduction to Joins and Their Importance\",\n      \"explanation\": \"Joins are used to combine rows from two or more tables based on a related column between them.  They are essential for querying data normalized across multiple tables, preventing data redundancy, and maintaining data integrity. Understanding different join types is critical for extracting the specific data you need.  Without joins, accessing related data would require multiple separate queries and manual data correlation in the application layer, which is inefficient and error-prone.\",\n      \"code_example\": null\n    },\n    {\n      \"title\": \"Inner Join\",\n      \"explanation\": \"An inner join returns only the rows that have matching values in both tables being joined. If a row in one table doesn't have a corresponding match in the other table, it will not be included in the result set.  It is the most common type of join and often implied as the default join type if none is specified.\",\n      \"code_example\": \"<precode>\\nSELECT orders.order_id, customers.customer_name\\nFROM orders\\nINNER JOIN customers ON orders.customer_id = customers.customer_id;\\n</precode>\"\n    },\n    {\n      \"title\": \"Left (Outer) Join\",\n      \"explanation\": \"A left join (or left outer join) returns all rows from the *left* table (the table mentioned first in the `FROM` clause), and the matching rows from the *right* table. If there's no match in the right table for a row in the left table, the right table's columns will contain `NULL` values for that row.  This is useful when you want to retrieve all data from the left table regardless of whether there is corresponding data in the right table.\",\n      \"code_example\": \"<precode>\\nSELECT customers.customer_name, orders.order_id\\nFROM customers\\nLEFT JOIN orders ON customers.customer_id = orders.customer_id;\\n</precode>\"\n    },\n    {\n      \"title\": \"Right (Outer) Join\",\n      \"explanation\": \"A right join (or right outer join) is the opposite of a left join. It returns all rows from the *right* table (the table mentioned second in the `FROM` clause), and the matching rows from the *left* table.  If there's no match in the left table for a row in the right table, the left table's columns will contain `NULL` values for that row.  You can often achieve the same result as a right join by swapping the order of tables in a left join.\",\n      \"code_example\": \"<precode>\\nSELECT customers.customer_name, orders.order_id\\nFROM customers\\nRIGHT JOIN orders ON customers.customer_id = orders.customer_id;\\n</precode>\"\n    },\n    {\n      \"title\": \"Full (Outer) Join\",\n      \"explanation\": \"A full join (or full outer join) combines the results of both left and right joins. It returns all rows from both tables. If there's no match in either table, the corresponding columns for the unmatched table will contain `NULL` values.  Not all database systems support full outer joins (e.g., MySQL versions before 8.0).\",\n      \"code_example\": \"<precode>\\nSELECT customers.customer_name, orders.order_id\\nFROM customers\\nFULL OUTER JOIN orders ON customers.customer_id = orders.customer_id;\\n</precode>\"\n    },\n    {\n      \"title\": \"Cross Join\",\n      \"explanation\": \"A cross join (also known as a Cartesian product) returns all possible combinations of rows from the tables being joined.  If table A has 'm' rows and table B has 'n' rows, a cross join will result in 'm * n' rows. Cross joins are generally used less frequently than other types of joins, often for generating test data or performing specific calculations requiring every combination of data.\",\n      \"code_example\": \"<precode>\\nSELECT customers.customer_name, products.product_name\\nFROM customers\\nCROSS JOIN products;\\n</precode>\"\n    },\n     {\n      \"title\": \"Self Join\",\n      \"explanation\": \"A self join is used to join a table to itself. This is useful when you need to compare rows within the same table, often based on hierarchical relationships or related data. To perform a self join, you alias the table with different names, allowing you to treat the table as if it were two separate tables.\",\n      \"code_example\": \"<precode>\\nSELECT e1.employee_name, e2.employee_name AS manager_name\\nFROM employees e1\\nINNER JOIN employees e2 ON e1.manager_id = e2.employee_id;\\n</precode>\"\n    },\n    {\n      \"title\": \"Non-Equi Joins\",\n      \"explanation\": \"Most joins use the `=` (equals) operator in the `ON` clause to compare related columns. A non-equi join uses a different operator, such as `<`, `>`, `<=`, `>=`, or `<>` (not equals).  Non-equi joins can be useful for range comparisons or other scenarios where an exact match is not required.\",\n      \"code_example\": \"<precode>\\nSELECT employees.employee_name, salaries.salary_range\\nFROM employees\\nJOIN salaries ON employees.salary BETWEEN salaries.min_salary AND salaries.max_salary;\\n</precode>\"\n    },\n    {\n      \"title\": \"Complex Join Conditions\",\n      \"explanation\": \"The `ON` clause in a join can contain multiple conditions combined with `AND` or `OR`.  Using multiple conditions allows for more precise matching and filtering of data. Complex join conditions can become quite intricate, requiring careful planning and testing to ensure correct results.\",\n      \"code_example\": \"<precode>\\nSELECT orders.order_id, customers.customer_name, products.product_name\\nFROM orders\\nJOIN customers ON orders.customer_id = customers.customer_id\\nJOIN order_items ON orders.order_id = order_items.order_id\\nJOIN products ON order_items.product_id = products.product_id\\nWHERE customers.city = 'New York' AND products.category = 'Electronics';\\n</precode>\"\n    },\n    {\n      \"title\": \"Using Aliases for Tables and Columns\",\n      \"explanation\": \"Aliases provide shorthand names for tables and columns within a query.  They improve readability, especially in complex queries with multiple joins. Aliases are defined using the `AS` keyword (though it's often omitted for tables). Using meaningful aliases makes the SQL code easier to understand and maintain.\",\n      \"code_example\": \"<precode>\\nSELECT c.customer_name, o.order_id\\nFROM customers AS c\\nJOIN orders AS o ON c.customer_id = o.customer_id;\\n</precode>\"\n    }\n  ]\n}\n```"},
          ],
        },
      ],
    });
  
    // const result = await chatSession.sendMessage("INSERT_INPUT_HERE");
    // console.log(result.response.text());
 