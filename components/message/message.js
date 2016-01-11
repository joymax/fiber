import React, { Component, PropTypes } from 'react';
import classNames from 'classnames';
import { Avatar, avatarSize } from '../avatar';
import Markdown from '../markdown';
import UserName from './username';
import Age from './age';
import MessageInput from './messageinput';
import { renderActions } from './action';
import style from './style';
import { promiseOnce, getOrFetch } from '../util';
import _ from 'lodash';

// TODO unread style
// TODO custom background
// TODO button with menu (reply, delete, star, like, etc)

export const getTime = (msg) => {
	const t = msg.updated_at || msg.created_at || msg.time;
	if (!t) return null;
	const d = new Date(t);
	return isNaN(d.getTime()) ? null : d;
};

export class Message extends Component {
	static propTypes = {
		className: PropTypes.string,
		data: PropTypes.object,
		avatarSize: Avatar.propTypes.size,
		isReply: PropTypes.bool,
	};

	static defaultProps = {
		className: '',
		data: {},
		avatarSize: '',
		isReply: false,
	};

	constructor(props) {
		super(props);
		this.state = {
			showReplyInput: false,
			showEdit: false,
		};
	}

	renderReplyInput() {
		if (!this.state.showReplyInput) return null;
		const props = this.props;
		const data = props.data || props;
		const hideReplyInput = () => {
			this.setState({ showReplyInput: false });
		};
		const sendReply = (text) => {
			hideReplyInput();
			if (_.isFunction(props.sendMessage)) {
				props.sendMessage({ thread_id: data.thread_id, in_reply_to: data.id, body: text });
			}
		};
		return <MessageInput submit={sendReply} cancel={hideReplyInput} focused/>;
	}

	renderEditor() {
		if (!this.state.showEdit) return null;
		const props = this.props;
		const data = props.data || props;
		const hideEdit = () => {
			this.setState({ showEdit: false });
		};
		const updateMessage = (text) => {
			hideEdit();
			if (_.isFunction(props.updateMessage)) {
				props.updateMessage({ thread_id: data.thread_id, id: data.id, body: text });
			}
		};
		return <MessageInput submit={updateMessage} cancel={hideEdit} focused value={data.body}/>;
	}

	renderActions() {
		const props = this.props;
		const data = props.data || props;
		const replies = data.replies || [];

		const showReply = () => {
			this.setState({ showReplyInput: true, showEdit: false });
		};

		const showEdit = () => {
			this.setState({ showEdit: true, showReplyInput: false });
		};

		const actions = {
			reply: { count: replies.length, onAction: showReply },
			like: { count: data.likes || 0 },
			edit: { onAction: showEdit },
			remove: { },
			star: { },
		};

		const actionProps = {
			onAction: props.onAction,
			canExecute: props.canExecute,
			iconSet: props.iconSet,
		};

		return renderActions(actions, 'message', data, actionProps);
	}

	render() {
		const props = this.props;
		const className = classNames('message', style.message, props.className, {
			[style.reply]: !!props.isReply,
		});
		const data = props.data || props;
		const user = data.user;
		const time = getTime(data);
		const fetchUser = promiseOnce(data.fetchUser || props.fetchUser, data);
		const userName = getOrFetch(fetchUser, user, 'name', 'login');

		const avatarProps = {
			user: user || fetchUser,
			size: props.avatarSize,
			circled: true,
			style: {
				float: 'left',
			},
		};

		const bodyProps = {
			className: classNames('message-body', style.message_body),
			style: {
				minHeight: avatarSize(props.avatarSize) - 16,
			},
		};

		// TODO support data.replies as promise
		const replies = data.replies || [];

		// TODO render admin badge
		// TODO spam icon
		// TODO render replies on reply count click or message click

		const replyElements = replies.map(d => {
			const replyProps = {
				data: d,
				isReply: true,
				avatarSize: props.avatarSize,
				fetchUser,
				onAction: props.onAction,
				canExecute: props.canExecute,
				sendMessage: props.sendMessage,
				updateMessage: props.updateMessage,
			};
			return <Message key={d.id} {...replyProps}/>;
		});

		return (
			<div className={className} data-id={data.id}>
				<Avatar {...avatarProps}/>
				<div className={classNames('meta', style.meta)}>
					{userName ? <UserName name={userName}/> : null}
					{time ? <Age time={time}/> : null}
					<span className={classNames('actions', style.actions)}>
						{this.renderActions()}
					</span>
				</div>
				<div {...bodyProps}>
					<Markdown source={data.body}/>
				</div>
				{this.renderReplyInput()}
				{this.renderEditor()}
				{replyElements}
			</div>
		);
	}
}

export default Message;
