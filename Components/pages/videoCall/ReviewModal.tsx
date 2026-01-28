import { Button, Modal, Rate, Typography } from 'antd'
import React, { ChangeEvent, FC } from 'react'

const { Title } = Typography;

type modalProps = {
    open: boolean;
    onSubmit: () => void;
    rating: number;
    reviewMessage: string;
    onClose: () => void;
    onRatingChange: (value: number) => void;
    onMessageChange: (e: ChangeEvent<HTMLTextAreaElement>) => void;
}

const ReviewModal: FC<modalProps> = ({ open, onClose, onSubmit, rating, onRatingChange, onMessageChange, reviewMessage }) => {
    const desc = ['terrible', 'bad', 'normal', 'good', 'wonderful'];

    return (
        <Modal
            title={
                <Title level={2}>Rate The Session</Title>
            }
            open={open}
            onCancel={onClose}
            footer={null}
            centered
            width={400}
        >
            <div className='warning-div'>
                <Rate tooltips={desc} allowHalf style={{ fontSize: 35 }} value={rating} onChange={onRatingChange} />
                <textarea
                    name="message"
                    value={reviewMessage}
                    onChange={onMessageChange}
                    style={{ width: "100%", marginTop: 10, border: '1px solid #d7d7d7', borderRadius: 8, padding: 10 }}
                    placeholder="Leave a comment"
                    rows={3}
                />
                <Button style={{ marginTop: 10 }} onClick={onSubmit}>Submit</Button>
            </div>
        </Modal>
    )
}

export default ReviewModal