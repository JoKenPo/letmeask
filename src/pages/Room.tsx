import { useParams } from 'react-router-dom';
import { FormEvent, useEffect, useState } from 'react';

import { useAuth } from '../hooks/useAuth';

import logoImg from '../assets/images/logo.svg';

import { Button } from '../components/Button';
import { RoomCode } from './../components/RoomCode';
import { database } from '../services/firebase';

import '../styles/room.scss';

type FirebaseQuestions = Record<string, {
	author: {
		name: string;
		avatar: string;
	}
	content: string;
	isAnswered: boolean;
	isHighlighted: boolean;
}>

type Question = {
	id: string;
	author: {
		name: string;
		avatar: string;
	}
	content: string;
	isAnswered: boolean;
	isHighlighted: boolean;
}

type RoomParams = {
	id: string;
}

export function Room() {
	const { user } = useAuth();
	const params = useParams<RoomParams>();
	const [newQuestion, setNewQuestion] = useState('');
	const [questions, setQuestions] = useState<Question[]>([]);
	const [title, setTitle] = useState('');

	const roomId = params.id;

	useEffect(() => {
		const roomRef = database.ref(`rooms/${roomId}`);

		roomRef.on('value', room => { //Trocamos once por on para executar sempre que houver uma nova alteração. Ou seja, OUVINDO. Foi comentado sobre outros eventos alem do 'value' no Firebase
			const databaseRoom = room.val();
			const firebaseQuestions: FirebaseQuestions = databaseRoom.questions;

			const parsedQuestions = Object.entries(firebaseQuestions).map(([key, value]) => {
				return {
					id: key,
					content: value.content,
					author: value.author,
					isHighlighted: value.isHighlighted,
					isAnswered: value.isAnswered
				}
			});

			setTitle(databaseRoom.title);
			setQuestions(parsedQuestions);
		})
	}, [roomId]); //Se array de dependências estiver vazio, executa apenas uma vez. Por isso é necessário deixar o gatilho na mudança do roomId 

	async function handleSendQuestion(event: FormEvent) {
		event.preventDefault();

		if (newQuestion.trim() === '') {
			return;
		}

		if (!user) {
			throw new Error('You must be logged in'); //Poderia ser com react-hot-toast
		}

		const question = {
			content: newQuestion,
			author: {
				name: user.name,
				avatar: user.avatar
			},
			isHighlighted: false,
			isAnswered: false
		};

		await database.ref(`rooms/${roomId}/questions`).push(question);

		setNewQuestion('');
	}

	return (
		<div id="page-room">
			<header>
				<div className="content">
					<img src={logoImg} alt="Letmeask"></img>
					<RoomCode code={roomId}></RoomCode>
				</div>
			</header>

			<main>
				<div className="room-title">
					<h1>Sala {title}</h1>
					{questions.length > 0 && (
						<span>{questions.length} pergunta(s)</span>
					)}
				</div>

				<form onSubmit={handleSendQuestion}>
					<textarea
						placeholder="O que você quer perguntar?"
						onChange={event => setNewQuestion(event.target.value)}
						value={newQuestion}
					></textarea>

					<div className="form-footer">
						{user ? (
							<div className="user-info">
								<img src={user.avatar} alt={user.name} />
								<span>{user.name}</span>
							</div>

						) : (
							<span>Para enviar uma pergunta, <button>faça seu login</button>.</span>
						)}
						<Button type="submit" disabled={!user}>Enviar pergunta</Button>
					</div>
				</form>
			</main>
		</div>
	);
}