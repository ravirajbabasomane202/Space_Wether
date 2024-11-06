import pandas as pd
import joblib
from flask import Flask, render_template, request, jsonify
from tensorflow.keras.models import load_model
from sklearn.preprocessing import StandardScaler

# Initialize Flask app
app = Flask(__name__)

# Load the trained model and scaler
model = load_model('geomagnetic_storm_model_nn.h5')
scaler = joblib.load('scaler.pkl')

@app.route('/')
def index():
    return render_template('index.html')  # Render the main page with sliders

@app.route('/predict', methods=['GET', 'POST'])
def predict():
    try:
        # Get latitude and longitude from the request
        latitude = request.args.get('latitude')
        longitude = request.args.get('longitude')

        # Check if latitude and longitude are provided
        if latitude is None or longitude is None:
            return jsonify({"error": "Latitude and longitude are required"}), 400

        # Convert to float
        latitude = float(latitude)
        longitude = float(longitude)

        # Scale the input data using the saved scaler
        scaled_input = scaler.transform([[latitude, longitude]])

        # Predict the KP index, solar wind, BZ, and proton density
        prediction = model.predict(scaled_input)

        # Return the predicted values as JSON
        return jsonify({
            'kp_index': prediction[0][0],
            'solar_wind_speed': prediction[0][1],
            'bz': prediction[0][2],
            'proton_density': prediction[0][3]
        })

    except ValueError:
        return jsonify({"error": "Invalid latitude or longitude values"}), 400
    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == '__main__':
    app.run(debug=True)
