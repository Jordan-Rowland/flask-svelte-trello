import os

from flask import (
        Flask,
        g,
        jsonify,
        render_template,
        request,
        send_from_directory
    )

from flask_login import LoginManager, current_user, login_user


from flask_sqlalchemy import SQLAlchemy


basedir = os.path.abspath(os.path.dirname(__file__))
app = Flask(__name__)



app.config["SQLALCHEMY_DATABASE_URI"] = \
    f"sqlite:///{os.path.join(basedir, 'data.sqlite')}"
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
app.config["SECRET_KEY"] = 'mysecretkey'

db = SQLAlchemy(app)
login_manager = LoginManager()
login_manager.init_app(app)


from models import List, Note, User

####################################
DEVELOPMENT = bool(os.environ.get("FLASK_DEVELOPMENT"))

@app.route("/")
def base():
    if DEVELOPMENT:
        print(f"\n*{'*' * 25}\n*\n* Development mode: {DEVELOPMENT}\n*\n*{'*' * 25}\n")
        print(g)
        print(current_user)
        return send_from_directory('client/public', 'index.html')
    return render_template('index.html')


@app.route("/<path:path>")
def home(path):
    return send_from_directory('client/public', path)
####################################


@app.route("/login", methods=["POST"])
def user_login():
    email = request.get_json().get("email")
    password = request.get_json().get("password")
    print(email)
    print(password)
    if not email or not password:
        print("login failed")
        return jsonify(success=False, message="No email or password supplied")
    user = User.query.filter_by(email=email.lower()).first()
    print(user)
    if user is not None and user.verify_password(password):
        print("login successful")
        login_user(user)
        return jsonify({"success":True})
    return "What ahppened"


@app.route("/token")
def get_token():
    return jsonify({
        "token": "access_token_11295"
    })


@app.route("/lists")
def get_lists():
    # lists = List.query.filter_by(user_id=96).all()
    lists = List.query.all()
    return jsonify({
        "lists": [_list.to_json() for _list in lists]
    })


@app.route("/addList", methods=["POST"])
def add_list():
    new_list = List.from_json(request.get_json())
    print(new_list)
    db.session.add(new_list)
    db.session.commit()
    return jsonify(new_list.to_json()), 201


@app.route("/list/<int:list_id>/notes")
def get_notes(list_id):
    notes = Note.query.filter_by(
        list_id=list_id).order_by(
        Note.timestamp.desc()).all()
    if not notes:
        return jsonify(status="This list was deleted")
    return jsonify({
        "notes": [note.to_json() for note in notes]
    })


@app.route("/deleteList/<int:list_id>", methods=["DELETE"])
def delete_list(list_id):
    List.query.filter_by(id=list_id).delete()
    Note.query.filter_by(list_id=list_id).delete()
    db.session.commit()
    return jsonify(success=True)


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
    if DEVELOPMENT:
        app.run(debug=True, port=3000)
    else:
        app.run(port=3000)
