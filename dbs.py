from server import db
from models import List, Note
from models import List, Note, User


# n = Note.query.all()
# l = List.query.filter_by(id=4).first()
# l = List.query.all()




try:
    db.drop_all()
except Exception:
    pass

db.create_all()



names = ['Todo', "Doing", "Done"]
user_ids = [69,69,96]


for name, id in zip(names, user_ids):
    db.session.add(List(name, id))

# db.session.add(lists)
db.session.commit()



# l = List(name="list1")
# n = Note("hello", list_id=1)

# db.session.add(l)

# n = Note.query.all()
# l = List.query.all(
