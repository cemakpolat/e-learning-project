# Udemylike Backend

This project aims at developing a e-learning backend system that is inspired from the udemy. 

## Start database and -management interface
```bash
   docker compose up -d
```


## Create Demo Data
```bash
   node seed.js
   
```
## Start project
```bash
   npm run dev
```

The project is still under development ...

# Testing Pagination
/courses?page=1&pageSize=10 (First page, 10 courses per page)
/courses?page=2&pageSize=20 (Second page, 20 courses per page)
/courses (Defaults to page 1, 10 courses per page)
