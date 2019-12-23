from server import db
from models import List, Note, User


db.session.query(Note).filter(User.id == 1).filter(List.id == 2).all()


n = Note.query.all()
l = List.query.all()
l



# l = List.query.filter_by(id=4).first()

def recreate_db():
    try:
        db.drop_all()
    except Exception:
        pass

    db.create_all()

# recreate_db()

# db.session.add(User("jordanrowland00@gmail.com", "password"))
# db.session.commit()

