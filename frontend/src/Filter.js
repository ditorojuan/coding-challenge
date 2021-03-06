import React, { useContext, useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faTimes } from '@fortawesome/free-solid-svg-icons'
import { useForm } from 'react-hook-form'

import api from './api'

import './Filter.css'
import './button.css'
import './form.css'
import './Modal.css'
import { AppContext } from './App'

function buildFilterRequest(values) {
    const array = Object.keys(values).map(key => {
        if (values[key].min || values[key].max) {
            const current = values[key]
            return Object.keys(current).map(_key => ({
                field: key,
                operator: _key === 'max' ? '<=' : '>=',
                value: current[_key] === '' ? 0 : current[_key],
            }))
        }

        return { field: key, value: values[key], operator: '>=' }
    })

    const flattedArray = array.flat()
    return flattedArray
}

const Filter = ({ close }) => {
    const [loading, setLoading] = useState(false)
    const { register, handleSubmit, watch } = useForm()
    const { setApartments } = useContext(AppContext)

    const onSubmit = values => {
        const data = {
            number_bedrooms: values.nRooms,
            price: {
                min: values.minPrice,
                max: values.maxPrice,
            },
            sqm: {
                min: values.minSize,
                max: values.maxSize,
            },
        }

        if (values.minSize === '' && values.maxSize === '') {
            delete data.sqm
        }
        if (values.minPrice === '' && values.maxPrice === '') {
            delete data.price
        }
        if (values.nRooms === '') {
            delete data.number_bedrooms
        }

        const req = api.get('/apartments', {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            params: { filters: buildFilterRequest(data) },
        })
        setLoading(true)

        req.then(res => {
            setLoading(false)
            setApartments(res.data.apartments)
            close()
        })
    }

    return (
        <form
            className="Filter"
            method="POST"
            onSubmit={handleSubmit(onSubmit)}
        >
            <div className="Modal__header">
                <h1>Filter</h1>
                <FontAwesomeIcon icon={faTimes} onClick={close} />
            </div>
            <div className="Modal__content">
                <div className="input__group input__group--column">
                    <h1>Price</h1>
                    <div className="input__group input__group--row">
                        <div className="input__group">
                            <label htmlFor="#minPrice">Min: </label>
                            <input
                                ref={register}
                                type="number"
                                id="minPrice"
                                name="minPrice"
                                min="0"
                                max="1000000"
                                step="50"
                            />
                        </div>
                        <div className="input__group">
                            <label htmlFor="#maxPrice">Max: </label>
                            <input
                                ref={register}
                                type="number"
                                id="maxPrice"
                                name="maxPrice"
                                min={watch('minPrice')}
                                max="1000000"
                                step="50"
                            />
                        </div>
                    </div>
                </div>
                <div className="input__group input__group--column">
                    <h1>Size</h1>
                    <div className="input__group input__group--row">
                        <div className="input__group">
                            <label htmlFor="#minSize">Min: </label>
                            <input
                                ref={register}
                                type="number"
                                id="minSize"
                                name="minSize"
                                min="0"
                                max="1000000"
                                step="10"
                            />
                        </div>
                        <div className="input__group">
                            <label htmlFor="#maxSize">Max: </label>
                            <input
                                ref={register}
                                type="number"
                                id="maxSize"
                                name="maxSize"
                                min={watch('minSize')}
                                max="1000000"
                                step="10"
                            />
                        </div>
                    </div>
                </div>
                <div className="input__group input__group--row">
                    <label htmlFor="#nRooms">Number of Rooms: </label>
                    <input
                        ref={register}
                        type="number"
                        min="1"
                        max="100"
                        step="1"
                        id="nRooms"
                        name="nRooms"
                    />
                    +
                </div>
            </div>
            <div className="Modal__footer">
                <button
                    className="btn btn--secondary"
                    onClick={e => {
                        e.preventDefault()
                        close()
                    }}
                >
                    Cancel
                </button>
                <button type="submit" className="btn btn--primary">
                    {loading ? 'Loading...' : 'Send'}
                </button>
            </div>
        </form>
    )
}

export default Filter
