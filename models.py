import datetime

from flask import url_for

from server import db


# Timezone adjustments
def now():
    return datetime.datetime.utcnow().replace(tzinfo=datetime.timezone.utc)

def astimezone(d, offset):
    return d.astimezone(datetime.timezone(datetime.timedelta(hours=offset)))

def PDTNow():
    return str(astimezone(now(), -7))

def PSTNow():
    return str(astimezone(now(), -8))


class Note(db.Model):
    __tablename__ = 'notes'

    id = db.Column(db.Integer(), primary_key=True)
    body = db.Column(db.Text(), index=True, nullable=False)
    timestamp = db.Column(db.Text(), nullable=False, default=PSTNow)
    list_id = db.Column(db.Integer(), db.ForeignKey("lists.id"))


    def __init__(self, body, list_id):
        self.body = body
        self.list_id = list_id

    def to_json(self):
        json_note = {
            "id": self.id,
            "body": self.body,
            "timestamp": self.timestamp,
            "list_id": self.list_id
        }
        return json_note

    @staticmethod
    def from_json(json_note):
        body = json_note.get('body')
        list_id = json_note.get('list_id')
        if (
            body is None
            or list_id == None
            or body == ''
            or list_id == ''
            ):
            raise Exception('Note does not have any body or list_id')
        return Note(body=body, list_id=list_id)


class List(db.Model):
    __tablename__ = 'lists'

    id = db.Column(db.Integer(), primary_key=True)
    name = db.Column(db.Text(), index=True, nullable=False)
    notes = db.relationship("Note", backref="list")
    # user_id needs to go here


    def __init__(self, name):
        self.name = name

    def to_json(self):
        json_list = {
            "id": self.id,
            "name": self.name,
        }
        return json_list

    @staticmethod
    def from_json(json_list):
        name = json_list.get('name')
        if name is None or name == '':
            raise Exception('List does not have any name')
        return List(name=name)
