import os

from flask import (Flask,
    jsonify,
    render_template,
    request,
    send_from_directory)
# from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy


basedir = os.path.abspath(os.path.dirname(__file__))
app = Flask(__name__)
# app = Flask(__name__,
    # static_folder='static/',)
    # template_folder='/client/public/')

app.config["SQLALCHEMY_DATABASE_URI"] = \
    f"sqlite:///{os.path.join(basedir, 'data.sqlite')}"
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

db = SQLAlchemy(app)

# CORS(app, resources={r'/*': {'origins': '*'}})

from models import List, Note

####################################
@app.route("/")
def base():
    # return send_from_directory('client/public', 'index.html')
    return render_template('index.html')


@app.route("/<path:path>")
def home(path):
    return send_from_directory('client/public', path)
####################################


@app.route("/lists")
def get_lists():
    lists = List.query.all()
    return jsonify({
        "lists": [_list.to_json() for _list in lists]
    })


@app.route("/addList", methods=["POST"])
def add_list():
    new_list = List.from_json(request.get_json())
    db.session.add(new_list)
    db.session.commit()
    return jsonify(new_list.to_json()), 201


@app.route("/list/<int:list_id>/notes")
def get_notes(list_id):
    notes = Note.query.filter_by(
        list_id=list_id).order_by(
        Note.timestamp.desc())
    return jsonify({
        "notes": [note.to_json() for note in notes]
    })


@app.route("/deleteList/<int:list_id>", methods=["DELETE"])
def delete_list(list_id):
    List.query.filter_by(id=list_id).delete()
    Note.query.filter_by(list_id=list_id).delete()
    db.session.commit()
    return jsonify({
        "success": True
    })


@app.route("/addNote", methods=["POST"])
def add_note():
    note = Note.from_json(request.get_json())
    db.session.add(note)
    db.session.commit()
    return jsonify(note.to_json()), 201


@app.route("/deleteNote/<int:note_id>", methods=["DELETE"])
def delete_note(note_id):
    Note.query.filter_by(id=note_id).delete()
    db.session.commit()
    return jsonify({
        "success": True
    })


if __name__ == "__main__":
    app.run(port=3000)
