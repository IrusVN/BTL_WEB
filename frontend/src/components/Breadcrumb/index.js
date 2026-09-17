import React from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronRight } from '@fortawesome/free-solid-svg-icons';
import * as styles from './Breadcrumb.module.scss';
import classNames from 'classnames/bind';

const cx = classNames.bind(styles);

function Breadcrumb({ items = [], className }) {
    if (!items || items.length === 0) return null;

    return (
        <nav className={cx('breadcrumb', className)} aria-label="Breadcrumb">
            {items.map((item, index) => {
                const isLast = index === items.length - 1;
                return (
                    <React.Fragment key={index}>
                        {index > 0 && (
                            <FontAwesomeIcon
                                icon={faChevronRight}
                                className={cx('breadcrumb-sep')}
                                aria-hidden="true"
                            />
                        )}
                        {item.to && !isLast ? (
                            <Link to={item.to} className={cx('breadcrumb-link')}>
                                {item.label}
                            </Link>
                        ) : (
                            <span className={cx('breadcrumb-current')} aria-current={isLast ? 'page' : undefined}>
                                {item.label}
                            </span>
                        )}
                    </React.Fragment>
                );
            })}
        </nav>
    );
}

export default Breadcrumb;
