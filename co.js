
তৌহিদ
তৌহিদ অন্তর
import React, { useEffect, useState } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { useParams } from 'react-router-dom';
import auth from '../firebase.init';
import purchaseBG from '../Assets/images/purchase-2.jpg'
import { toast } from 'react-toastify';

const PurchasePage = () => {
    const { productId } = useParams();
    const [product, setProduct] = useState({});
    const [number, setNumber] = useState(0)
    const [user] = useAuthState(auth);

    useEffect(() => {
        fetch(https://morning-sea-61188.herokuapp.com/product/${productId})
            .then(res => res.json())
            .then(data => setProduct(data))

    }, [product, productId])


    const incNum = () => {
        if (number < product.quantity) {
            setNumber(Number(number) + 1);

        }
        if (number > product.quantity) {
            toast.error('You cross our limit');

        }
    };
    const decNum = () => {
        if (number > product.minimum) {
            setNumber(number - 1);

        }
        if (number < product.minimum) {
            toast.error("Please Input Minimum value!");

        }
    }


    const handleChange = (e) => {
        setNumber(e.target.value);
    };

    const totalPrice = parseInt(number) * parseInt(product.price);


    const handleOrder = event => {
        event.preventDefault()
        const order = {
            productName: product.name,
            email: user.email,
            price: totalPrice,
            quantity: event.target.quantity.value,
            phone: event.target.phone.value,
            address: event.target.address.value
        }

        fetch('https://morning-sea-61188.herokuapp.com/orders', {
            method: 'POST',
            headers: {
                'content-type': 'application/json'
            },
            body: JSON.stringify(order)
        })

            .then(res => res.json())
            .then(data => {
                console.log(data);
                if (data.insertedId) {

                    toast.success('Purchase Succeed, Check My Orders to Pay')
                    event.target.reset();

                }
            })

    }




    return (
        <div className='px-12' style={{
            background: url(${ purchaseBG }),
            backgroundSize: 'cover'
        }}>
            <h1 className='text-center text-2xl font-bold mb-12 mt-11 uppercase'>Your Purchase Information: {product.name}</h1>
            <div className=' lg:flex flex-row'>
                <div className='lg:flex-1 items-center'>
                    <div className="card glass m-10 p-10">
                        <figure><img className='rounded' src={product.image} alt="car!" /></figure>
                        <div className="card-body ">
                            <h2 className="text-2xl uppercase font-bold">{product.name}</h2>
                            <p className='text-justify'>{product.description}</p>
                            <div className='text-center'>
                                <div>
                                    <p className='text-secondary font-bold '>Quantity: {product.quantity}</p>
                                </div>
                                <div>
                                    <p className='font-bold text-red-600'> Min. Order: {product.minimum}</p>
                                </div>
                                <div>
                                    <p className='font-bold'> Price: {product.price} <small className="badge badge-xs">per piece</small></p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className='lg:flex-1'>
                    <div className=" card glass m-10 p-10">
                        <h1 className='text-2xl font-bold uppercase text-secondary mb-2'>Your details Info to purchase</h1>
                        <p className='text-2xl uppercase'>Name: {user?.displayName}</p>
                        <p className='text-2xl uppercase'>Email: {user?.email}</p>




                        <form onSubmit={handleOrder} className='w-full text-xl text-black form-control'>
                            <label className="label">
                                <span className="label-text font-semibold text-lg">Name</span>
                            </label>
                            <input type="text" readOnly value={user.displayName} className="input input-bordered w-full input-sm max-w-xs" />

                            <label className="label">
                                <span className="label-text font-semibold text-lg">Email</span>
                            </label>
                            <input type="email" readOnly value={user.email} className="input input-bordered w-full input-sm max-w-xs" />

                            <label className="label">
                                <span className="label-text font-semibold text-lg">Product Quantity</span>
                            </label>
                            <input type="number" min={product.minimum} max={product.available} name='quantity' readOnly />