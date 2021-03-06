import supertest from 'supertest'
import qs from 'qs'
import fs from 'fs'
import { app } from '../src'

const request = supertest(app)

describe('APARTMENTS API', () => {
    it('should error with no apartments', async done => {
        const res = await request.get('/apartments/all')
        const body = res.body

        expect(res.status).toEqual(404)
        expect(body.data.message).toBeDefined()
        done()
    })

    it('should create an apartment', async done => {
        const obj = {
            price: 100,
            sqm: 10,
            title: 'Test Apartment',
            number_bathrooms: 2,
            number_bedrooms: 2,
            coords: { lat: 10, lon: 200 },
        }
        const res = await request.post('/apartments').send(obj)
        const body = res.body

        expect(res.status).toEqual(201)
        expect(body.data.message).toBeDefined()
        done()
    })

    it('should create an apartment with file', async done => {
        const obj = {
            price: 100,
            sqm: 10,
            title: 'Test Apartment',
            number_bathrooms: 2,
            number_bedrooms: 2,
            coords: { lat: 10, lon: 200 },
        }
        const res = await request
            .post('/apartments')
            .field('price', obj.price)
            .field('sqm', obj.sqm)
            .field('title', obj.title)
            .field('number_bathrooms', obj.number_bathrooms)
            .field('number_bedrooms', obj.number_bedrooms)
            .attach('file', __dirname + '/test.jpg')

        const body = res.body

        expect(res.status).toEqual(201)
        expect(body.data.message).toBeDefined()

        done()
    }) // timeout is 60s bc internet in venezuela is slow af :( and im using mongo atlas for simplicity

    it('should retrieve an recently created image', async done => {
        const obj = {
            price: 100,
            sqm: 10,
            title: 'Test Apartment',
            number_bathrooms: 2,
            number_bedrooms: 2,
            coords: { lat: 10, lon: 200 },
        }
        const res = await request
            .post('/apartments')
            .field('price', obj.price)
            .field('sqm', obj.sqm)
            .field('title', obj.title)
            .field('number_bathrooms', obj.number_bathrooms)
            .field('number_bedrooms', obj.number_bedrooms)
            .attach('file', __dirname + '/test.jpg')

        const file = await request.get(
            `/apartments/images/${res.body.data.apartment._id}/0.jpg`
        )

        console.log(file)

        expect(file.status).toEqual(200)
        // expect(file.).toBeDefined()

        done()
    })

    it('should error because of missing argument', async done => {
        const obj = {}
        const res = await request.post('/apartments').send(obj)
        const body = res.body

        expect(res.status).toEqual(400)
        expect(body.data.message).toContain('Missing argument')

        done()
    })

    it('should give one apartment with id', async done => {
        const obj = {
            price: 100,
            sqm: 10,
            title: 'Test Apartment',
            number_bathrooms: 2,
            number_bedrooms: 2,
            coords: { lat: 10, lon: 200 },
        }
        const {
            body: { data },
        } = await request.post('/apartments').send(obj)
        const { _id } = data.apartment
        const res = await request.get('/apartments/' + _id)
        const body = res.body

        expect(res.status).toEqual(200)
        expect(body.data.apartment).toBeDefined()
        expect(body.data.apartment.images).toBeDefined()
        expect(body.data.apartment._id).toEqual(_id)

        done()
    })

    it('should give error with apartment not found', async done => {
        const _id = 1
        const res = await request.get('/apartments/' + _id)
        const body = res.body

        expect(res.status).toEqual(404)
        expect(body.data.apartment).not.toBeDefined()

        done()
    })

    it('should correctly filter by price', async done => {
        const obj = {
            price: 200,
            sqm: 10,
            title: 'Test Apartment',
            number_bathrooms: 2,
            number_bedrooms: 2,
            coords: { lat: 10, lon: 200 },
        }
        await request.post('/apartments').send(obj)

        const filters = [
            {
                field: 'price',
                value: 100,
                operator: '>=',
            },
            {
                field: 'price',
                value: 800,
                operator: '<=',
            },
        ]

        const query = qs.stringify({ filters })
        const res = await request.get('/apartments/').query(query)
        const body = res.body

        expect(res.status).toEqual(200)
        expect(body.apartments[0].price).toBeGreaterThanOrEqual(100)
        expect(body.apartments[0].price).toBeLessThanOrEqual(800)

        done()
    })

    it('should give empty array while filtering by price ', async done => {
        const filters = [
            {
                field: 'price',
                value: 2000,
                operator: '>=',
            },
        ]
        const query = qs.stringify({ filters })
        console.warn(query)
        const res = await request.get('/apartments/').query(query)
        const body = res.body

        expect(res.status).toEqual(200)
        expect(body.apartments.length).toBe(0)

        done()
    })

    it('should get all apartments', async done => {
        const obj = {
            price: 100,
            sqm: 10,
            title: 'Test Apartment',
            number_bathrooms: 2,
            number_bedrooms: 2,
            coords: { lat: 10, lon: 200 },
        }
        await request.post('/apartments').send(obj)
        obj.price = 1303
        await request
            .post('/apartments')
            .field('price', obj.price)
            .field('sqm', obj.sqm)
            .field('title', obj.title)
            .field('number_bathrooms', obj.number_bathrooms)
            .field('number_bedrooms', obj.number_bedrooms)
            .attach('file', __dirname + '/test.jpg')

        const res = await request.get('/apartments/all')
        const body = res.body

        expect(res.status).toEqual(200)
        expect(body.data.apartments).toBeDefined()
        expect(body.data.apartments.length).toEqual(2)
        expect(body.data.apartments[0].images).toBeDefined()
        done()
    })
})
