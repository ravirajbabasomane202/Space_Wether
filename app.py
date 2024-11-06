from flask import Flask, render_template, jsonify, request
import pandas as pd
import joblib
import tensorflow as tf

app = Flask(__name__)

# Load the trained neural network model
model_filename = 'geomagnetic_storm_model_nn.h5'
model = tf.keras.models.load_model(model_filename)

# Load the scaler
scaler_filename = 'scaler.pkl'
scaler = joblib.load(scaler_filename)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/data')
def data():
    # Default values for the sliders
    return jsonify({
        'KP index': '10',
        'Solar wind': '20',
        'BZ': '30',
        'Proton density': '40'
    })

@app.route('/predict', methods=['POST'])
def predict():
    # Get the input data from the request
    input_data = request.get_json()
    
    # Extract latitude and longitude
    latitude = input_data['latitude']
    longitude = input_data['longitude']
    
    # Scale the input features
    features = scaler.transform([[latitude, longitude]])

    # Make a prediction using the neural network model
    prediction = model.predict(features)[0]

    # Assuming the order of predictions is consistent with labels
    kp_index, solar_wind_speed, bz, proton_density = prediction

    # Return the prediction as a JSON response
    return jsonify({
        'kp_index': kp_index,
        'solar_wind': solar_wind_speed,
        'bz': bz,
        'proton_density': proton_density,
        'latitude': latitude,
        'longitude': longitude
    })

if __name__ == '__main__':
    app.run(debug=True)
