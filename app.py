from flask import Flask, render_template, jsonify

app = Flask(__name__)

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

if __name__ == '__main__':
    app.run(debug=True)
