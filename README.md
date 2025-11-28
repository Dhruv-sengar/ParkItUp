# 🚗 ParkItUp (SmartPark)

> **Find your perfect parking spot in seconds.** 
> *Seamlessly connect with parking owners and book your spot hassle-free.*

[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![FastAPI](https://img.shields.io/badge/FastAPI-005571?style=for-the-badge&logo=fastapi)](https://fastapi.tiangolo.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Python](https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://www.python.org/)

---

## 🌟 Overview

**ParkItUp** is a modern, full-stack web application designed to revolutionize how people find and rent parking spaces. Whether you have an empty driveway to list or need a spot in a crowded city, ParkItUp makes the process smooth, secure, and efficient.

Built with a robust **FastAPI** backend and a dynamic **React** frontend, this project demonstrates a scalable architecture using **MongoDB** for data persistence.

## ✨ Key Features

*   **🔐 Secure Authentication**: Robust user signup and login system.
*   **🏙️ Smart Listings**: Browse available parking spots with high-quality images and detailed descriptions.
*   **📅 Easy Booking**: Book your desired spot with just a few clicks.
*   **👤 User Profiles**: Manage your bookings, listings, and personal details.
*   **📱 Responsive Design**: A beautiful, mobile-first interface built with Tailwind CSS.
*   **⚡ Blazing Fast**: Powered by Vite and FastAPI for optimal performance.

## 🛠️ Tech Stack

### Frontend
*   **Framework**: React (v18)
*   **Build Tool**: Vite
*   **Styling**: Tailwind CSS
*   **Routing**: React Router DOM

### Backend
*   **Framework**: FastAPI
*   **Database**: MongoDB (using Motor for async driver)
*   **Authentication**: JWT (JSON Web Tokens)

## 🚀 Getting Started

Follow these steps to get a local copy up and running.

### Prerequisites
*   Node.js & npm
*   Python 3.8+
*   MongoDB (Local or Atlas)

### Installation

1.  **Clone the repo**
    ```sh
    git clone https://github.com/Dhruv-sengar/ParkItUp.git
    cd ParkItUp
    ```

2.  **Backend Setup**
    ```sh
    cd backend
    python -m venv .venv
    # Windows
    .venv\Scripts\activate
    # Mac/Linux
    # source .venv/bin/activate
    pip install -r requirements.txt
    ```

3.  **Environment Variables**
    Create a `.env` file in the `backend` directory (use `.env.template` as a guide) and add your MongoDB URI.
    ```env
    MONGODB_URI=mongodb://localhost:27017/smartpark
    SECRET_KEY=your_secret_key
    ```

4.  **Frontend Setup**
    ```sh
    cd ../ # Go back to root
    npm install
    ```

### Running the App

1.  **Start the Backend**
    ```sh
    # In the backend directory
    uvicorn app.main:app --reload
    ```

2.  **Start the Frontend**
    ```sh
    # In the root directory
    npm run dev
    ```

3.  Visit `http://localhost:5173` to view the app!

## 📸 Screenshots

*(Add your screenshots here)*

## 🤝 Contributing

Contributions are what make the open source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

1.  Fork the Project
2.  Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3.  Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4.  Push to the Branch (`git push origin feature/AmazingFeature`)
5.  Open a Pull Request

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

---

<p align="center">
  Made with ❤️ by Dhruv Sengar
</p>
