import React, { Component, PropTypes } from 'react';
import classNames from 'classnames';
import { Message, MessageInput, getTime, Counter } from '../message';
import { renderActions } from '../message/action';
import ContributorList from './contributors';
import Avatar from '../avatar';
import Day from './day';
import style from './style.scss';
import moment from 'moment';
import observable from 'observable';
import _ from 'lodash';
import {
	getDay,
	getMsgDay,
	getDayMessages,
	countMessages,
	collectContributors,
} from './util';

// TODO allow to use custom MessageInput component
export class Thread extends Component {
	static propTypes = {
		className: PropTypes.string,
		topic: PropTypes.string,
		messages: PropTypes.array,
		avatarSize: Avatar.propTypes.size,
		fetchUser: PropTypes.func,
		theme: PropTypes.string,
	};

	static defaultProps = {
		className: '',
		topic: '',
		messages: [],
		theme: 'plain',
	};

	constructor(props) {
		super(props);
		this.state = {
			collapsed: true,
		};
	}

	renderActions() {
		const props = this.props;

		const actions = {
			like: { count: props.likes || 0 },
			remove: { },
			star: { },
		};

		const actionProps = {
			onAction: props.onAction,
			canExecute: props.canExecute,
			iconSet: props.iconSet,
		};

		return renderActions(actions, 'thread', props, actionProps);
	}

	renderHeader() {
		const props = this.props;
		const subject = props.subject || props.topic;
		const className = classNames(style.thread_header);
		const count = countMessages(props.messages || []) || 0;
		const collapse = () => {
			this.setState({ collapsed: !this.state.collapsed });
		};
		return (
			<div className={className}>
				<a onClick={collapse}>{subject}</a>
				<Counter count={count} title={`${count} messages`} />
				<span className={classNames(style.actions)}>
					{this.renderActions()}
				</span>
			</div>
		);
	}

	render() {
		const props = this.props;
		const className = classNames(style.thread, props.className);
		const messages = props.messages || [];
		const items = [];

		if (this.state.collapsed) {
			const users = observable([]);
			collectContributors(users, messages, props.fetchUser);
			items.push(
				<ContributorList key={`cl-${props.id}`} users={users} />
			);
		} else {
			const collapseDay = time => {
				const k = `collapsedDay${+time}`;
				this.setState({ [k]: !this.state[k] });
			};

			const isCollapsedDay = time => {
				const k = `collapsedDay${+time}`;
				return !!this.state[k];
			};

			const makeDay = (time, msgcount) => {
				const dayProps = {
					time,
					count: msgcount,
					onClick: () => collapseDay(time),
				};
				return <Day key={`day-${props.id}-${+time}`} {...dayProps} />;
			};

			const renderMessage = (msg) => {
				const msgProps = {
					data: msg,
					avatarSize: props.avatarSize,
					iconSet: props.iconSet,
					fetchUser: props.fetchUser,
					onAction: props.onAction,
					canExecute: props.canExecute,
					sendMessage: props.sendMessage,
					updateMessage: props.updateMessage,
					theme: props.theme,
				};
				return <Message key={msg.id} {...msgProps} />;
			};

			let collaseMessages = false;
			for (let i = 0; i < messages.length; i++) {
				const msg = messages[i];
				const time = getTime(msg);
				const day = getDay(time);
				if (moment.isDate(time) && (i === 0 || day !== getMsgDay(messages[i - 1]))) {
					collaseMessages = isCollapsedDay(time);
					const dayMessages = getDayMessages(messages, i);
					const msgcount = countMessages(dayMessages);
					items.push(makeDay(time, msgcount));
				}
				if (collaseMessages) continue;
				items.push(renderMessage(msg));
			}

			const sendMessage = (body) => {
				if (_.isFunction(props.sendMessage)) {
					props.sendMessage({ thread_id: props.id, body });
				}
			};

			items.push(<MessageInput key={`message-input-${props.id}`} submit={sendMessage} />);
		}

		return (
			<div className={className}>
				{this.renderHeader()}
				{items}
			</div>
		);
	}
}

export default Thread;
