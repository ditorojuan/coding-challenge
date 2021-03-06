import express from 'express'
import Apartment from '../models/apartment'
import fileUpload from 'express-fileupload'
import fs from 'fs'

import { responseFactory, resolveOperator, getImages } from '../utils'

const router = express.Router()

router.use(
    fileUpload({
        createParentPath: true,
    })
)

/*
 * Create an apartment
 * */
router.post('/', async (req, res) => {
    const { files, body } = req
    const {
        title,
        sqm,
        number_bathrooms,
        number_bedrooms,
        coords,
        price,
    } = body

    const apartment = new Apartment({
        title,
        sqm,
        price,
        number_bathrooms,
        number_bedrooms,
        coords,
        created_at: Date.now(),
        updated_at: Date.now(),
    })

    const response = await apartment
        .save()
        .then(apartment => {
            const { _id } = apartment

            // we save all files in the server
            if (files) {
                const files_promises = Object.keys(files).map((key, index) => {
                    return new Promise((resolve, reject) => {
                        files[key].mv(
                            __dirname + `/../../images/${_id}/${index}.jpg`,
                            err => {
                                if (err) {
                                    reject()
                                } else {
                                    resolve()
                                }
                            }
                        )
                    })
                })

                return Promise.all(files_promises)
                    .then(() =>
                        responseFactory(201, {
                            message: 'Apartment created successfully',
                            apartment,
                        })
                    )
                    .catch(() =>
                        responseFactory(500, {
                            message: 'Error while uploading file',
                        })
                    )
            }
            return responseFactory(201, {
                message: 'Apartment created successfully',
                apartment,
            })
        })
        .catch(err => {
            console.error('[Apartments] ', err)
            return responseFactory(400, { message: 'Missing argument ', err })
        })

    return res.status(response.statusCode).json({ data: response.data })
})

router.get('/', async (req, res) => {
    const { query } = req
    const { filters } = query
    if (filters) {
        const mongoFilters = filters.reduce((acc, filter) => {
            const { operator, field, value } = JSON.parse(filter)
            const mongoOperator = resolveOperator(operator)
            return {
                ...acc,
                [field]: {
                    ...acc[field],
                    [mongoOperator]: Number(value),
                },
            }
        }, {})
        console.warn(mongoFilters)
        Apartment.find(mongoFilters, async (err, apartments) => {
            let response
            if (apartments) {
                apartments = await Promise.all(
                    apartments.map(async apartment => {
                        const images = await getImages(apartment._id)
                        return {
                            ...apartment._doc,
                            images,
                        }
                    })
                )
                response = responseFactory(200, {
                    apartments,
                })
            } else if (err) {
                response = responseFactory(400, {
                    error: err,
                })
            }

            return res.status(response.statusCode).json(response.data)
        })
    } else return res.status(400).send()
})

/*
 * Get all apartments
 * */
router.get('/all', async (req, res) => {
    Apartment.find({}, async (error, apartments) => {
        let response
        if (apartments && apartments.length > 0) {
            apartments = await Promise.all(
                apartments.map(async apartment => {
                    const images = await getImages(apartment._id)
                    return {
                        ...apartment._doc,
                        images,
                    }
                })
            )
            response = responseFactory(200, {
                apartments,
            })
        } else {
            response = responseFactory(500, { message: error })
        }

        return res.status(response.statusCode).json({ data: response.data })
    })
})

/*
 * Get apartment by ID
 * */
router.get('/:id', async (req, res) => {
    Apartment.findById(req.params.id, async (err, apartment) => {
        let response
        if (err && !apartment) {
            response = responseFactory(404, {
                message: 'Apartment not found',
            })
        } else if (err) {
            response = responseFactory(500, {
                message: 'Internal Error',
                error: err,
            })
        } else if (apartment) {
            const images = await getImages(apartment._id)
            const _apartment = apartment._doc

            response = responseFactory(200, {
                apartment: { ..._apartment, images },
            })
        }

        return res.status(response.statusCode).json({ data: response.data })
    })
})

/*
 * Get image
 * */
router.use('/images', express.static(__dirname + '/../../images'))

export default router
