const express = require('express')
const path = require('path')
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const cors = require('cors');

const dbPath = path.join(__dirname, 'movieDatabase.db')
const app = express()

app.use(cors());
app.use(express.json())

let db

const initialiseDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })

    app.listen(4000, () => {
      console.log('Server has started on port 4000')
    })
  } catch (e) {
    console.log(e.message)
    process.exit(1)
  }
}

initialiseDbAndServer()

const hasSearchProperty = requestQuery => {
  return requestQuery.search_q !== undefined
}

const searchMovie = async (search_q) => {
    const getMoviesQuery = `
    SELECT * FROM movies 
    WHERE title LIKE '%${search_q}%';
    `
    const movies = await db.all(getMoviesQuery)
    return movies
}

app.get('/', async (req, res) => {
  const {search_q} = req.query;

  if(hasSearchProperty(req.query)){
    const movies = await searchMovie(search_q)
    return res.send(movies)
  }
  
  const getQuery = `SELECT * FROM movies`;
  const movieDetails = await db.all(getQuery);
  res.send(movieDetails);
})

app.get('/top-rated', async (req, res) => {
  const {search_q} = req.query;

  if(hasSearchProperty(req.query)){
    const getMoviesQuery = `
        SELECT * FROM movies 
        WHERE rating >= 8 AND title LIKE '%${search_q}%';
        `
    const movies = await db.all(getMoviesQuery)
    return res.send(movies)
  }

  const getQuery = `SELECT * FROM movies WHERE rating >= 8`
  const movieDetails = await db.all(getQuery)
  res.send(movieDetails)
})

app.get('/upcoming', async (req, res) => {
    const {search_q} = req.query;
    const todayDate = new Date();
    let movies;
    
    if(hasSearchProperty(req.query)){
        const getMoviesQuery = `
        SELECT * FROM movies 
        WHERE title LIKE '%${search_q}%';
        `
        movies = await db.all(getMoviesQuery)
    }else{
        const getQuery = `SELECT * FROM movies`;
        movies = await db.all(getQuery)
    }
    
    const releaseDates = movies.filter(eachMovie => {
        const releaseYear = eachMovie.release_date.slice(0,4)
        const releaseMonth = eachMovie.release_date.slice(5,7)
        const releaseDay = eachMovie.release_date.slice(8,10)
        const releaseDate = new Date(releaseYear,releaseMonth,releaseDay)
        
        if(releaseDate > todayDate){
            return eachMovie
        }
    })

    res.send(releaseDates)
})

app.get('/movie/:id', async(req, res) => {
    const movieId = req.params.id
    const getMoviesQuery = `SELECT * FROM movies WHERE id=${movieId}`;
    const getCastQuery = `SELECT * FROM movie_cast WHERE movie_id=${movieId}`;
    const movie = await db.get(getMoviesQuery)
    const cast = await db.all(getCastQuery)
    const getMovie = {
        movie_details: movie,
        cast_details: cast
    }
    res.send(getMovie)

})
